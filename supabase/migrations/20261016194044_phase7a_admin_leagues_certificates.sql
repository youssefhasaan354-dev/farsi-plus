/*
# Phase 7A: Admin panel, weekly leagues, certificates, feedback, audit log

## Overview
Adds infrastructure for the admin panel (dashboard stats, content management, review queue,
error reports, feedback inbox, audit log), weekly league snapshots and promotion logic,
certificates for stage/unit completion, and an admin audit log.

## New Tables
- admin_audit_log: records every admin write action (who, what, when, target)
- certificates: auto-generated certificates for completing a stage or unit
- feedback: messages from the contact form (public insert, admin read)

## New Functions
- get_admin_dashboard(): returns aggregate stats
- approve_content(p_table, p_id): sets needs_review = false, records approver
- update_report_status(p_report_id, p_status, p_admin_notes): updates a report
- compute_weekly_leagues(): snapshots XP into leaderboard_weekly, assigns ranks and leagues
- get_weekly_leaderboard(): returns current week's leaderboard for the calling user's league
- issue_certificate(p_type, p_reference_id): creates a certificate if earned

## Security
- admin_audit_log: admin-only read, insert via SECURITY DEFINER functions only
- certificates: owner-scoped read, admin read, insert via function only
- feedback: public insert, admin-only read/update/delete
- All admin functions check is_admin() server-side
- Storage bucket: public read, admin write
*/

-- ─── Admin audit log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_audit_log_select_admin" ON admin_audit_log;
CREATE POLICY "admin_audit_log_select_admin" ON admin_audit_log FOR SELECT
  TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

-- ─── Certificates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type text NOT NULL CHECK (certificate_type IN ('stage', 'unit')),
  reference_id uuid NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  issue_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, certificate_type, reference_id)
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificates_select_own" ON certificates;
CREATE POLICY "certificates_select_own" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "certificates_select_admin" ON certificates;
CREATE POLICY "certificates_select_admin" ON certificates FOR SELECT
  TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- ─── Feedback table (contact form) ───────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_insert_public" ON feedback;
CREATE POLICY "feedback_insert_public" ON feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "feedback_select_admin" ON feedback;
CREATE POLICY "feedback_select_admin" ON feedback FOR SELECT
  TO authenticated USING (is_admin());
DROP POLICY IF EXISTS "feedback_update_admin" ON feedback;
CREATE POLICY "feedback_update_admin" ON feedback FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "feedback_delete_admin" ON feedback;
CREATE POLICY "feedback_delete_admin" ON feedback FOR DELETE
  TO authenticated USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ─── Helper: log admin action ────────────────────────────────
CREATE OR REPLACE FUNCTION log_admin_action(p_action text, p_target_table text, p_target_id uuid DEFAULT NULL, p_details jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  INSERT INTO admin_audit_log (admin_id, action, target_table, target_id, details)
  VALUES (auth.uid(), p_action, p_target_table, p_target_id, p_details);
END;
$$;

REVOKE EXECUTE ON FUNCTION log_admin_action FROM anon;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- ─── Admin dashboard stats ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_new_this_week int;
  v_lessons_completed int;
  v_active_today int;
  v_active_7d int;
  v_premium_count int;
  v_hardest_exercises jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT count(*) INTO v_total_users FROM profiles;
  SELECT count(*) INTO v_new_this_week FROM profiles WHERE created_at >= now() - interval '7 days';
  SELECT count(*) INTO v_lessons_completed FROM user_progress WHERE status = 'completed';
  SELECT count(DISTINCT user_id) INTO v_active_today FROM user_progress WHERE updated_at::date = CURRENT_DATE;
  SELECT count(DISTINCT user_id) INTO v_active_7d FROM user_progress WHERE updated_at >= now() - interval '7 days';
  SELECT count(*) INTO v_premium_count FROM profiles WHERE is_premium = true;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_hardest_exercises
  FROM (
    SELECT
      e.id AS exercise_id,
      l.title_ar AS lesson_title,
      e.type AS exercise_type,
      count(m.id) AS wrong_count
    FROM mistakes m
    JOIN exercises e ON m.exercise_id = e.id
    JOIN lessons l ON e.lesson_id = l.id
    GROUP BY e.id, l.title_ar, e.type
    ORDER BY wrong_count DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'new_this_week', v_new_this_week,
    'lessons_completed', v_lessons_completed,
    'active_today', v_active_today,
    'active_7d', v_active_7d,
    'premium_count', v_premium_count,
    'hardest_exercises', v_hardest_exercises
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_dashboard FROM anon;
GRANT EXECUTE ON FUNCTION get_admin_dashboard TO authenticated;

-- ─── Approve content (set needs_review = false) ──────────────
CREATE OR REPLACE FUNCTION approve_content(p_table text, p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_allowed text[] := ARRAY['stages', 'units', 'lessons', 'exercises', 'vocabulary'];
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF NOT (p_table = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;

  EXECUTE format('UPDATE %I SET needs_review = false, updated_at = now() WHERE id = $1', p_table)
  USING p_id;

  PERFORM log_admin_action('approve', p_table, p_id);

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION approve_content FROM anon;
GRANT EXECUTE ON FUNCTION approve_content TO authenticated;

-- ─── Update report status ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_report_status(p_report_id uuid, p_status text, p_admin_notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('pending', 'reviewed', 'resolved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE reports SET status = p_status, admin_notes = p_admin_notes
  WHERE id = p_report_id;

  PERFORM log_admin_action('update_report', 'reports', p_report_id, jsonb_build_object('status', p_status));

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_report_status FROM anon;
GRANT EXECUTE ON FUNCTION update_report_status TO authenticated;

-- ─── Compute weekly leagues ──────────────────────────────────
CREATE OR REPLACE FUNCTION compute_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM leaderboard_weekly WHERE week_start_date = v_week_start;

  INSERT INTO leaderboard_weekly (user_id, week_start_date, total_xp, league, rank)
  SELECT
    p.id,
    v_week_start,
    p.total_xp,
    CASE
      WHEN p.total_xp < 100 THEN 'bronze'
      WHEN p.total_xp < 500 THEN 'silver'
      WHEN p.total_xp < 1500 THEN 'gold'
      WHEN p.total_xp < 3000 THEN 'sapphire'
      WHEN p.total_xp < 6000 THEN 'ruby'
      ELSE 'diamond'
    END AS league_name,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN p.total_xp < 100 THEN 'bronze'
          WHEN p.total_xp < 500 THEN 'silver'
          WHEN p.total_xp < 1500 THEN 'gold'
          WHEN p.total_xp < 3000 THEN 'sapphire'
          WHEN p.total_xp < 6000 THEN 'ruby'
          ELSE 'diamond'
        END
      ORDER BY p.total_xp DESC
    )
  FROM profiles p
  WHERE p.total_xp > 0;

  PERFORM log_admin_action('compute_leagues', 'leaderboard_weekly', NULL, jsonb_build_object('week_start', v_week_start));
END;
$$;

REVOKE EXECUTE ON FUNCTION compute_weekly_leagues FROM anon;
GRANT EXECUTE ON FUNCTION compute_weekly_leagues TO authenticated;

-- ─── Get weekly leaderboard for current user's league ─────────
CREATE OR REPLACE FUNCTION get_weekly_leaderboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_week_start date := date_trunc('week', CURRENT_DATE)::date;
  v_user_league text;
  v_result jsonb;
BEGIN
  SELECT league INTO v_user_league
  FROM leaderboard_weekly
  WHERE user_id = auth.uid() AND week_start_date = v_week_start;

  IF v_user_league IS NULL THEN
    SELECT
      CASE
        WHEN total_xp < 100 THEN 'bronze'
        WHEN total_xp < 500 THEN 'silver'
        WHEN total_xp < 1500 THEN 'gold'
        WHEN total_xp < 3000 THEN 'sapphire'
        WHEN total_xp < 6000 THEN 'ruby'
        ELSE 'diamond'
      END
    INTO v_user_league
    FROM profiles WHERE id = auth.uid();

    v_user_league := COALESCE(v_user_league, 'bronze');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', lw.user_id,
    'total_xp', lw.total_xp,
    'rank', lw.rank,
    'league', lw.league,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'is_me', lw.user_id = auth.uid()
  ) ORDER BY lw.rank), '[]'::jsonb) INTO v_result
  FROM leaderboard_weekly lw
  JOIN profiles p ON lw.user_id = p.id
  WHERE lw.league = v_user_league AND lw.week_start_date = v_week_start;

  RETURN jsonb_build_object('league', v_user_league, 'entries', v_result);
END;
$$;

REVOKE EXECUTE ON FUNCTION get_weekly_leaderboard FROM anon;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard TO authenticated;

-- ─── Issue certificate ───────────────────────────────────────
CREATE OR REPLACE FUNCTION issue_certificate(p_type text, p_reference_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_lessons int;
  v_completed_lessons int;
  v_title_ar text;
  v_title_en text;
  v_existing uuid;
  v_cert_id uuid;
BEGIN
  IF p_type NOT IN ('stage', 'unit') THEN
    RAISE EXCEPTION 'Invalid certificate type';
  END IF;

  IF p_type = 'stage' THEN
    SELECT count(*) INTO v_total_lessons
    FROM lessons l JOIN units u ON l.unit_id = u.id
    WHERE u.stage_id = p_reference_id;

    SELECT count(*) INTO v_completed_lessons
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    JOIN units u ON l.unit_id = u.id
    WHERE u.stage_id = p_reference_id AND up.user_id = auth.uid() AND up.status = 'completed';

    SELECT title_ar, title_en INTO v_title_ar, v_title_en
    FROM stages WHERE id = p_reference_id;
  ELSE
    SELECT count(*) INTO v_total_lessons
    FROM lessons l WHERE l.unit_id = p_reference_id;

    SELECT count(*) INTO v_completed_lessons
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE l.unit_id = p_reference_id AND up.user_id = auth.uid() AND up.status = 'completed';

    SELECT title_ar, title_en INTO v_title_ar, v_title_en
    FROM units WHERE id = p_reference_id;
  END IF;

  IF v_total_lessons = 0 THEN
    RAISE EXCEPTION 'No lessons found';
  END IF;

  IF v_completed_lessons < v_total_lessons THEN
    RETURN jsonb_build_object('issued', false, 'reason', 'not_completed',
      'completed', v_completed_lessons, 'total', v_total_lessons);
  END IF;

  SELECT id INTO v_existing
  FROM certificates
  WHERE user_id = auth.uid() AND certificate_type = p_type AND reference_id = p_reference_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('issued', true, 'already_exists', true, 'certificate_id', v_existing);
  END IF;

  INSERT INTO certificates (user_id, certificate_type, reference_id, title_ar, title_en)
  VALUES (auth.uid(), p_type, p_reference_id, v_title_ar, v_title_en)
  RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object('issued', true, 'already_exists', false, 'certificate_id', v_cert_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION issue_certificate FROM anon;
GRANT EXECUTE ON FUNCTION issue_certificate TO authenticated;

-- ─── Storage bucket for audio files ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('vocabulary-audio', 'vocabulary-audio', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vocab_audio_public_read" ON storage.objects;
CREATE POLICY "vocab_audio_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vocabulary-audio');

DROP POLICY IF EXISTS "vocab_audio_admin_write" ON storage.objects;
CREATE POLICY "vocab_audio_admin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vocabulary-audio' AND is_admin());

DROP POLICY IF EXISTS "vocab_audio_admin_update" ON storage.objects;
CREATE POLICY "vocab_audio_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vocabulary-audio' AND is_admin())
  WITH CHECK (bucket_id = 'vocabulary-audio' AND is_admin());

DROP POLICY IF EXISTS "vocab_audio_admin_delete" ON storage.objects;
CREATE POLICY "vocab_audio_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vocabulary-audio' AND is_admin());
