-- ============================================================================
-- Migration: 20261017110000_stage2_secure_profiles_and_game_tables_rls.sql
-- Description: Stage 2.1, 2.2, 2.5 Security Hardening:
--   1. Protect profiles table:
--      - Revoke INSERT & DELETE from authenticated and anon.
--      - Drop dangerous insert/delete policies.
--      - Restrict UPDATE to safe, non-sensitive columns.
--      - BEFORE UPDATE trigger blocking sensitive column tampering.
--   2. Lock game tables from client direct mutation:
--      - user_progress, user_xp_log, streaks, user_achievements,
--        certificates, leaderboard_weekly, daily_quests, user_boosters,
--        user_purchases, subscriptions.
--      - Allow only SELECT to row owner.
--   3. Secure reports & feedback tables against spam/tampering.
--   4. Admin visibility policies & admin_set_role RPC with audit logging.
-- ============================================================================

-- ─── 1. SECURE PROFILES TABLE (2.1) ──────────────────────────────────────────

-- Revoke dangerous table privileges
REVOKE INSERT, DELETE ON public.profiles FROM authenticated, anon;
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Drop unsafe policies
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;

-- Ensure select policy
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Restrict update policy to own row
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger to prevent client from updating sensitive fields
CREATE OR REPLACE FUNCTION public.check_profile_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If invoked as regular authenticated user (not service_role)
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Cannot update role directly';
    END IF;
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Cannot update is_premium directly';
    END IF;
    IF NEW.gems IS DISTINCT FROM OLD.gems THEN
      RAISE EXCEPTION 'Cannot update gems directly';
    END IF;
    IF NEW.hearts IS DISTINCT FROM OLD.hearts THEN
      RAISE EXCEPTION 'Cannot update hearts directly';
    END IF;
    IF NEW.total_xp IS DISTINCT FROM OLD.total_xp THEN
      RAISE EXCEPTION 'Cannot update total_xp directly';
    END IF;
    IF NEW.streak_count IS DISTINCT FROM OLD.streak_count THEN
      RAISE EXCEPTION 'Cannot update streak_count directly';
    END IF;
    IF NEW.streak_freeze_count IS DISTINCT FROM OLD.streak_freeze_count THEN
      RAISE EXCEPTION 'Cannot update streak_freeze_count directly';
    END IF;
    IF NEW.last_study_date IS DISTINCT FROM OLD.last_study_date THEN
      RAISE EXCEPTION 'Cannot update last_study_date directly';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot update email directly';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_profile_sensitive_update ON public.profiles;
CREATE TRIGGER trg_check_profile_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_sensitive_update();


-- ─── 2. LOCK GAME TABLES FROM CLIENT MUTATIONS (2.2) ─────────────────────────

-- user_progress
REVOKE INSERT, UPDATE, DELETE ON public.user_progress FROM authenticated, anon;
DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_delete_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_select_own" ON public.user_progress;
CREATE POLICY "user_progress_select_own" ON public.user_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_xp_log
REVOKE INSERT, UPDATE, DELETE ON public.user_xp_log FROM authenticated, anon;
DROP POLICY IF EXISTS "user_xp_log_insert_own" ON public.user_xp_log;
DROP POLICY IF EXISTS "user_xp_log_update_own" ON public.user_xp_log;
DROP POLICY IF EXISTS "user_xp_log_delete_own" ON public.user_xp_log;
DROP POLICY IF EXISTS "user_xp_log_select_own" ON public.user_xp_log;
CREATE POLICY "user_xp_log_select_own" ON public.user_xp_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- streaks
REVOKE INSERT, UPDATE, DELETE ON public.streaks FROM authenticated, anon;
DROP POLICY IF EXISTS "streaks_insert_own" ON public.streaks;
DROP POLICY IF EXISTS "streaks_update_own" ON public.streaks;
DROP POLICY IF EXISTS "streaks_delete_own" ON public.streaks;
DROP POLICY IF EXISTS "streaks_select_own" ON public.streaks;
CREATE POLICY "streaks_select_own" ON public.streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_achievements
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM authenticated, anon;
DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_update_own" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_delete_own" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_select_own" ON public.user_achievements;
CREATE POLICY "user_achievements_select_own" ON public.user_achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- certificates
REVOKE INSERT, UPDATE, DELETE ON public.certificates FROM authenticated, anon;
DROP POLICY IF EXISTS "certificates_insert_own" ON public.certificates;
DROP POLICY IF EXISTS "certificates_update_own" ON public.certificates;
DROP POLICY IF EXISTS "certificates_delete_own" ON public.certificates;
DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own" ON public.certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- leaderboard_weekly
REVOKE INSERT, UPDATE, DELETE ON public.leaderboard_weekly FROM authenticated, anon;
DROP POLICY IF EXISTS "leaderboard_weekly_insert_own" ON public.leaderboard_weekly;
DROP POLICY IF EXISTS "leaderboard_weekly_update_own" ON public.leaderboard_weekly;
DROP POLICY IF EXISTS "leaderboard_weekly_delete_own" ON public.leaderboard_weekly;
DROP POLICY IF EXISTS "leaderboard_weekly_select_all" ON public.leaderboard_weekly;
CREATE POLICY "leaderboard_weekly_select_all" ON public.leaderboard_weekly FOR SELECT
  TO authenticated USING (true);

-- daily_quests
REVOKE INSERT, UPDATE, DELETE ON public.daily_quests FROM authenticated, anon;
DROP POLICY IF EXISTS "daily_quests_insert_own" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_update_own" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_delete_own" ON public.daily_quests;
DROP POLICY IF EXISTS "daily_quests_select_own" ON public.daily_quests;
CREATE POLICY "daily_quests_select_own" ON public.daily_quests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_boosters
REVOKE INSERT, UPDATE, DELETE ON public.user_boosters FROM authenticated, anon;
DROP POLICY IF EXISTS "user_boosters_insert_own" ON public.user_boosters;
DROP POLICY IF EXISTS "user_boosters_update_own" ON public.user_boosters;
DROP POLICY IF EXISTS "user_boosters_delete_own" ON public.user_boosters;
DROP POLICY IF EXISTS "user_boosters_select_own" ON public.user_boosters;
CREATE POLICY "user_boosters_select_own" ON public.user_boosters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- user_purchases
REVOKE INSERT, UPDATE, DELETE ON public.user_purchases FROM authenticated, anon;
DROP POLICY IF EXISTS "user_purchases_insert_own" ON public.user_purchases;
DROP POLICY IF EXISTS "user_purchases_update_own" ON public.user_purchases;
DROP POLICY IF EXISTS "user_purchases_delete_own" ON public.user_purchases;
DROP POLICY IF EXISTS "user_purchases_select_own" ON public.user_purchases;
CREATE POLICY "user_purchases_select_own" ON public.user_purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- subscriptions
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated, anon;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- reports: user can only INSERT their own reports, cannot update status or admin_notes
REVOKE UPDATE, DELETE ON public.reports FROM authenticated, anon;
DROP POLICY IF EXISTS "reports_update_own" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_own" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- feedback: add validation check constraints if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
    ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS chk_feedback_message_len;
    ALTER TABLE public.feedback ADD CONSTRAINT chk_feedback_message_len CHECK (char_length(message) BETWEEN 5 AND 2000);
    
    ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS chk_feedback_email_format;
    ALTER TABLE public.feedback ADD CONSTRAINT chk_feedback_email_format CHECK (
      email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );
  END IF;
END $$;


-- ─── 3. ADMIN POLICIES & ROLE MANAGEMENT (2.5) ───────────────────────────────

-- Admin policies on profiles, reports, and user_progress
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "reports_admin_select" ON public.reports;
CREATE POLICY "reports_admin_select" ON public.reports FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "reports_admin_update" ON public.reports;
CREATE POLICY "reports_admin_update" ON public.reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_progress_admin_select" ON public.user_progress;
CREATE POLICY "user_progress_admin_select" ON public.user_progress FOR SELECT
  TO authenticated USING (public.is_admin());

-- RPC admin_set_role
CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin privilege required';
  END IF;

  IF p_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Log action in admin_audit_log if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_log') THEN
    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, details)
    VALUES (
      auth.uid(),
      'SET_ROLE',
      'profile',
      p_user_id,
      jsonb_build_object('new_role', p_role)
    );
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;
