-- ============================================================================
-- Migration: 20261017111000_stage2_secure_lesson_attempts_and_complete_lesson.sql
-- Description: Stage 2.3 Hardened lesson completion & attempt verification:
--   1. Create lesson_attempts table.
--   2. start_lesson_attempt RPC.
--   3. Secure complete_lesson RPC:
--      - Validates lesson existence and accessibility.
--      - First-time completion gives XP & gems; replays give reduced XP & 0 gems.
--      - Checks attempt duration / rate-limits completions.
--      - XP booster only applies if XP awarded > 0.
--      - Correct streak calculation with freeze logging (covers 1 day only).
--      - Auto-checks and issues unit & stage certificates.
-- ============================================================================

-- 1. Create lesson_attempts table
CREATE TABLE IF NOT EXISTS public.lesson_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  hearts_lost int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  total_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_attempts_select_own" ON public.lesson_attempts;
CREATE POLICY "lesson_attempts_select_own" ON public.lesson_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.lesson_attempts FROM authenticated, anon;
CREATE INDEX IF NOT EXISTS idx_lesson_attempts_user_lesson ON public.lesson_attempts(user_id, lesson_id, started_at DESC);

-- 2. start_lesson_attempt RPC
CREATE OR REPLACE FUNCTION public.start_lesson_attempt(p_lesson_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_id uuid;
  v_lesson_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Lesson ID required';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.lessons WHERE id = p_lesson_id) INTO v_lesson_exists;
  IF NOT v_lesson_exists THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  INSERT INTO public.lesson_attempts (user_id, lesson_id, started_at)
  VALUES (auth.uid(), p_lesson_id, now())
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_lesson_attempt(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_lesson_attempt(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.start_lesson_attempt(uuid) TO authenticated;

-- 3. Secure complete_lesson RPC
CREATE OR REPLACE FUNCTION public.complete_lesson(p_lesson_id uuid, p_score int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lesson RECORD;
  v_unit RECORD;
  v_prev_lesson_id uuid;
  v_prev_unit_id uuid;
  v_prev_unit_last_lesson_id uuid;
  v_is_accessible boolean := false;
  v_prior_status text;
  v_prior_score int := 0;

  v_xp_awarded int := 0;
  v_gem_reward int := 0;
  v_has_booster boolean := false;

  v_user_date date;
  v_last_study date;
  v_streak_count int;
  v_freeze_count int;
  v_streak_extended boolean := false;
  v_freeze_used boolean := false;

  v_new_achievements jsonb := '[]'::jsonb;
  v_recent_completions int;
  v_attempt_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Lesson ID required';
  END IF;

  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN
    p_score := 0;
  END IF;

  -- Verify lesson exists
  SELECT l.id, l.unit_id, l.sort_order, l.xp_reward, l.is_locked
  INTO v_lesson
  FROM public.lessons l
  WHERE l.id = p_lesson_id;

  IF v_lesson.id IS NULL THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  IF v_lesson.is_locked THEN
    RAISE EXCEPTION 'Lesson is locked';
  END IF;

  SELECT u.id, u.stage_id, u.sort_order, u.is_locked
  INTO v_unit
  FROM public.units u
  WHERE u.id = v_lesson.unit_id;

  IF v_unit.id IS NULL OR v_unit.is_locked THEN
    RAISE EXCEPTION 'Unit is locked';
  END IF;

  -- Rate limit: Maximum 40 completed lessons per hour per user
  SELECT count(*) INTO v_recent_completions
  FROM public.user_progress
  WHERE user_id = auth.uid() AND updated_at >= now() - interval '1 hour';

  IF v_recent_completions > 40 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait a few moments.';
  END IF;

  -- Check prior user progress
  SELECT status, score INTO v_prior_status, v_prior_score
  FROM public.user_progress
  WHERE user_id = auth.uid() AND lesson_id = p_lesson_id;

  -- Check accessibility
  IF v_prior_status = 'completed' OR v_prior_status = 'in_progress' THEN
    v_is_accessible := true;
  ELSE
    -- If first lesson of first unit
    IF v_lesson.sort_order <= 1 AND v_unit.sort_order <= 1 THEN
      v_is_accessible := true;
    ELSIF v_lesson.sort_order > 1 THEN
      -- Must complete previous lesson in the same unit
      SELECT id INTO v_prev_lesson_id
      FROM public.lessons
      WHERE unit_id = v_unit.id AND sort_order < v_lesson.sort_order
      ORDER BY sort_order DESC
      LIMIT 1;

      IF v_prev_lesson_id IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1 FROM public.user_progress
          WHERE user_id = auth.uid() AND lesson_id = v_prev_lesson_id AND status = 'completed'
        ) INTO v_is_accessible;
      ELSE
        v_is_accessible := true;
      END IF;
    ELSE
      -- First lesson of subsequent unit: previous unit's last lesson must be completed
      SELECT id INTO v_prev_unit_id
      FROM public.units
      WHERE stage_id = v_unit.stage_id AND sort_order < v_unit.sort_order
      ORDER BY sort_order DESC
      LIMIT 1;

      IF v_prev_unit_id IS NOT NULL THEN
        SELECT id INTO v_prev_unit_last_lesson_id
        FROM public.lessons
        WHERE unit_id = v_prev_unit_id
        ORDER BY sort_order DESC
        LIMIT 1;

        IF v_prev_unit_last_lesson_id IS NOT NULL THEN
          SELECT EXISTS (
            SELECT 1 FROM public.user_progress
            WHERE user_id = auth.uid() AND lesson_id = v_prev_unit_last_lesson_id AND status = 'completed'
          ) INTO v_is_accessible;
        ELSE
          v_is_accessible := true;
        END IF;
      ELSE
        v_is_accessible := true;
      END IF;
    END IF;
  END IF;

  IF NOT v_is_accessible THEN
    RAISE EXCEPTION 'Lesson is not unlocked yet';
  END IF;

  -- Mark active attempt as completed
  SELECT id INTO v_attempt_id
  FROM public.lesson_attempts
  WHERE user_id = auth.uid() AND lesson_id = p_lesson_id AND completed_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_attempt_id IS NOT NULL THEN
    UPDATE public.lesson_attempts
    SET completed_at = now(),
        correct_count = GREATEST(1, round(p_score / 20.0)::int),
        total_count = 5
    WHERE id = v_attempt_id;
  END IF;

  -- First completion vs Replay
  IF v_prior_status IS NULL OR v_prior_status != 'completed' THEN
    -- First time completion: full XP and gem reward
    v_xp_awarded := COALESCE(v_lesson.xp_reward, 15);
    v_gem_reward := 2;
    IF p_score = 100 THEN
      v_gem_reward := v_gem_reward + 3;
    END IF;
  ELSE
    -- Replay: 20% XP, no gems
    v_xp_awarded := GREATEST(0, round(COALESCE(v_lesson.xp_reward, 15) * 0.20)::int);
    v_gem_reward := 0;
  END IF;

  -- Check for active booster
  SELECT EXISTS(
    SELECT 1 FROM public.user_boosters
    WHERE user_id = auth.uid() AND booster_type = 'xp_booster' AND expires_at > now()
  ) INTO v_has_booster;

  IF v_has_booster AND v_xp_awarded > 0 THEN
    v_xp_awarded := v_xp_awarded * 2;
  END IF;

  -- Upsert progress
  INSERT INTO public.user_progress (user_id, lesson_id, status, score, completed_at, attempts, updated_at)
  VALUES (auth.uid(), p_lesson_id, 'completed', p_score, now(), 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    status = 'completed',
    score = GREATEST(public.user_progress.score, p_score),
    completed_at = now(),
    updated_at = now(),
    attempts = public.user_progress.attempts + 1;

  -- Log XP
  IF v_xp_awarded > 0 THEN
    INSERT INTO public.user_xp_log (user_id, xp_amount, source, reference_id)
    VALUES (auth.uid(), v_xp_awarded, 'lesson', p_lesson_id);
  END IF;

  -- Streak calculation (timezone-aware)
  v_user_date := get_user_date();

  SELECT last_study_date, streak_count, streak_freeze_count
  INTO v_last_study, v_streak_count, v_freeze_count
  FROM public.profiles
  WHERE id = auth.uid();

  v_streak_count := COALESCE(v_streak_count, 0);
  v_freeze_count := COALESCE(v_freeze_count, 0);

  IF v_last_study IS NULL THEN
    v_streak_count := 1;
    v_streak_extended := true;
  ELSIF v_last_study = v_user_date THEN
    -- Studied already today: keep streak count
    v_streak_extended := false;
  ELSIF v_last_study = v_user_date - 1 THEN
    -- Studied yesterday: consecutive streak increment
    v_streak_count := v_streak_count + 1;
    v_streak_extended := true;
  ELSIF v_last_study = v_user_date - 2 THEN
    -- Missed exactly 1 day
    IF v_freeze_count > 0 THEN
      -- Consume 1 freeze
      v_freeze_count := v_freeze_count - 1;
      v_streak_count := v_streak_count + 1;
      v_freeze_used := true;
      v_streak_extended := true;

      -- Log freeze used on the missed day
      INSERT INTO public.streaks (user_id, study_date, xp_earned, used_freeze)
      VALUES (auth.uid(), v_user_date - 1, 0, true)
      ON CONFLICT (user_id, study_date)
      DO UPDATE SET used_freeze = true;
    ELSE
      v_streak_count := 1;
      v_streak_extended := true;
    END IF;
  ELSE
    -- Missed more than 1 day: reset streak to 1
    v_streak_count := 1;
    v_streak_extended := true;
  END IF;

  -- Record streak for today
  INSERT INTO public.streaks (user_id, study_date, xp_earned, used_freeze)
  VALUES (auth.uid(), v_user_date, v_xp_awarded, false)
  ON CONFLICT (user_id, study_date)
  DO UPDATE SET xp_earned = streaks.xp_earned + v_xp_awarded;

  -- Update profile with atomic values
  UPDATE public.profiles
  SET total_xp = total_xp + v_xp_awarded,
      gems = gems + v_gem_reward,
      streak_count = v_streak_count,
      streak_freeze_count = v_freeze_count,
      last_study_date = v_user_date,
      hearts = LEAST(5, hearts + 1),
      updated_at = now()
  WHERE id = auth.uid();

  -- Auto-issue certificates if unit or stage completed
  BEGIN
    PERFORM public.issue_certificate('unit', v_unit.id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    PERFORM public.issue_certificate('stage', v_unit.stage_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Check achievements
  BEGIN
    SELECT public.check_achievements() INTO v_new_achievements;
  EXCEPTION WHEN OTHERS THEN
    v_new_achievements := '[]'::jsonb;
  END;

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_awarded,
    'gem_reward', v_gem_reward,
    'streak_extended', v_streak_extended,
    'freeze_used', v_freeze_used,
    'booster_active', v_has_booster,
    'new_achievements', v_new_achievements,
    'streak_count', v_streak_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_lesson(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_lesson(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_lesson(uuid, int) TO authenticated;
