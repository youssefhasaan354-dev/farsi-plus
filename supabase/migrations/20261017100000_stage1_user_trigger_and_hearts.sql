-- ============================================================================
-- Migration: 20261017100000_stage1_user_trigger_and_hearts.sql
-- Description: Stage 1 fixes:
--   1. Add onboarding_completed and hearts_updated_at to profiles
--   2. Safe handle_new_user() trigger on auth.users with backfill for existing users
--   3. lose_heart() RPC (SECURITY DEFINER)
--   4. sync_user_hearts() RPC for automatic 4-hour heart replenishment
--   5. Grant safe column updates to authenticated users
-- ============================================================================

-- 1. Add columns to profiles if they do not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'hearts_updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN hearts_updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2. Create handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_display_name text;
  v_timezone text;
BEGIN
  v_display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(COALESCE(new.email, 'user'), '@', 1)
  );

  v_timezone := COALESCE(
    new.raw_user_meta_data->>'timezone',
    'Africa/Cairo'
  );

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    native_language,
    learning_goal,
    daily_goal_minutes,
    daily_goal_xp,
    cefr_level,
    is_premium,
    role,
    total_xp,
    hearts,
    gems,
    streak_count,
    streak_freeze_count,
    timezone,
    onboarding_completed,
    hearts_updated_at,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    COALESCE(new.email, ''),
    v_display_name,
    new.raw_user_meta_data->>'avatar_url',
    'ar',
    NULL,
    15,
    75,
    'A0',
    false,
    'user',
    0,
    5,
    50,
    0,
    1,
    v_timezone,
    false,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN new;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing auth.users without a profile
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  native_language,
  daily_goal_minutes,
  daily_goal_xp,
  cefr_level,
  is_premium,
  role,
  total_xp,
  hearts,
  gems,
  streak_count,
  streak_freeze_count,
  timezone,
  onboarding_completed,
  hearts_updated_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, 'user'), '@', 1)),
  'ar',
  15,
  75,
  'A0',
  false,
  'user',
  0,
  5,
  50,
  0,
  1,
  COALESCE(u.raw_user_meta_data->>'timezone', 'Africa/Cairo'),
  true,
  now(),
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. lose_heart RPC
CREATE OR REPLACE FUNCTION public.lose_heart()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_hearts int;
  v_new_hearts int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT hearts INTO v_current_hearts
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_new_hearts := GREATEST(0, v_current_hearts - 1);

  UPDATE public.profiles
  SET hearts = v_new_hearts,
      hearts_updated_at = now(),
      updated_at = now()
  WHERE id = auth.uid();

  RETURN v_new_hearts;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.lose_heart() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lose_heart() FROM anon;
GRANT EXECUTE ON FUNCTION public.lose_heart() TO authenticated;

-- 4. sync_user_hearts RPC (restores 1 heart every 4 hours, up to 5)
CREATE OR REPLACE FUNCTION public.sync_user_hearts()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hearts int;
  v_last_update timestamptz;
  v_hours_passed float;
  v_hearts_to_add int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  SELECT hearts, COALESCE(hearts_updated_at, updated_at, now())
  INTO v_hearts, v_last_update
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_hearts >= 5 THEN
    UPDATE public.profiles
    SET hearts_updated_at = now()
    WHERE id = auth.uid();
    RETURN v_hearts;
  END IF;

  v_hours_passed := extract(epoch FROM (now() - v_last_update)) / 3600.0;
  v_hearts_to_add := floor(v_hours_passed / 4.0)::int;

  IF v_hearts_to_add > 0 THEN
    v_hearts := LEAST(5, v_hearts + v_hearts_to_add);
    UPDATE public.profiles
    SET hearts = v_hearts,
        hearts_updated_at = CASE
          WHEN v_hearts >= 5 THEN now()
          ELSE v_last_update + (v_hearts_to_add * interval '4 hours')
        END,
        updated_at = now()
    WHERE id = auth.uid();
  END IF;

  RETURN v_hearts;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_user_hearts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_user_hearts() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_user_hearts() TO authenticated;

-- 5. Grant safe column updates to authenticated users
GRANT UPDATE (
  display_name,
  avatar_url,
  learning_goal,
  daily_goal_minutes,
  daily_goal_xp,
  cefr_level,
  native_language,
  timezone,
  onboarding_completed
) ON public.profiles TO authenticated;
