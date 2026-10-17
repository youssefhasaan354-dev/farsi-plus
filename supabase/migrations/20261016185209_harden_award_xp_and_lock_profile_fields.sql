/*
# Harden award_xp and lock sensitive profile fields

## Overview
Replaces the client-trusting award_xp function with a server-authoritative version
that computes XP from the lesson's own xp_reward column, prevents double-awarding
within the same day, and ensures hearts/gems/streak cannot be modified directly by clients.

## Changes

### 1. Replace award_xp function (DROP + CREATE with new return type)
- OLD: accepted p_xp_amount from client (any value 1-1000), returned void
- NEW: accepts p_lesson_id via p_reference_id, looks up xp_reward from lessons table
- Returns int (actual XP awarded, 0 if already completed today)
- Prevents double-awarding: checks user_xp_log for existing entry today
- Non-lesson sources still accept p_xp_amount but capped at 100

### 2. Add complete_lesson function
- SECURITY DEFINER: marks lesson completed, awards XP, updates streak, grants heart back
- All mutations server-side — client cannot set hearts/gems/streak directly

### 3. Add refill_hearts function
- Costs 50 gems to refill hearts to 5, checks balance server-side

### 4. Lock profiles columns
- Revokes ALL update on profiles, grants only safe columns
- hearts, gems, streak_count, total_xp, last_study_date now only via SECURITY DEFINER functions
*/

-- Drop old award_xp (return type changes from void to int)
DROP FUNCTION IF EXISTS award_xp(int, text, uuid);

-- ─── New award_xp: server-authoritative ──────────────────────
CREATE OR REPLACE FUNCTION award_xp(p_xp_amount int, p_source text DEFAULT 'lesson', p_reference_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lesson_xp int;
  v_already_awarded boolean;
BEGIN
  IF p_source IS NULL OR p_source NOT IN ('lesson', 'practice', 'quest', 'achievement', 'admin') THEN
    RAISE EXCEPTION 'Invalid XP source';
  END IF;

  IF p_source = 'lesson' AND p_reference_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_xp_log
      WHERE user_id = auth.uid()
        AND source = 'lesson'
        AND reference_id = p_reference_id
        AND created_at::date = CURRENT_DATE
    ) INTO v_already_awarded;

    IF v_already_awarded THEN
      RETURN 0;
    END IF;

    SELECT xp_reward INTO v_lesson_xp FROM lessons WHERE id = p_reference_id;
    IF v_lesson_xp IS NULL THEN
      RAISE EXCEPTION 'Lesson not found';
    END IF;
  ELSE
    IF p_xp_amount IS NULL OR p_xp_amount <= 0 OR p_xp_amount > 100 THEN
      RAISE EXCEPTION 'Invalid XP amount';
    END IF;
    v_lesson_xp := p_xp_amount;
  END IF;

  INSERT INTO user_xp_log (user_id, xp_amount, source, reference_id)
  VALUES (auth.uid(), v_lesson_xp, p_source, p_reference_id);

  UPDATE profiles SET total_xp = total_xp + v_lesson_xp, updated_at = now()
  WHERE id = auth.uid();

  RETURN v_lesson_xp;
END;
$$;

REVOKE EXECUTE ON FUNCTION award_xp FROM anon;
GRANT EXECUTE ON FUNCTION award_xp TO authenticated;


-- ─── complete_lesson: marks progress, awards XP, updates streak ──
CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id uuid, p_score int DEFAULT 0)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_xp_awarded int;
  v_last_study date;
BEGIN
  IF p_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Lesson ID required';
  END IF;

  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN
    p_score := 0;
  END IF;

  INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at, attempts, updated_at)
  VALUES (auth.uid(), p_lesson_id, 'completed', p_score, now(), 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET status = 'completed', score = GREATEST(user_progress.score, p_score),
    completed_at = now(), updated_at = now(),
    attempts = user_progress.attempts + 1;

  SELECT award_xp(NULL, 'lesson', p_lesson_id) INTO v_xp_awarded;

  SELECT last_study_date INTO v_last_study FROM profiles WHERE id = auth.uid();

  IF v_last_study IS NULL OR v_last_study < CURRENT_DATE THEN
    UPDATE profiles
    SET streak_count = streak_count + 1,
        last_study_date = CURRENT_DATE,
        hearts = LEAST(hearts + 1, 5),
        updated_at = now()
    WHERE id = auth.uid();
  ELSIF v_last_study = CURRENT_DATE THEN
    UPDATE profiles
    SET hearts = LEAST(hearts + 1, 5),
        updated_at = now()
    WHERE id = auth.uid() AND hearts < 5;
  END IF;

  RETURN v_xp_awarded;
END;
$$;

REVOKE EXECUTE ON FUNCTION complete_lesson FROM anon;
GRANT EXECUTE ON FUNCTION complete_lesson TO authenticated;


-- ─── refill_hearts: spend gems to restore hearts ─────────────
CREATE OR REPLACE FUNCTION refill_hearts()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gems int;
  v_hearts int;
BEGIN
  SELECT gems, hearts INTO v_gems, v_hearts
  FROM profiles WHERE id = auth.uid();

  IF v_gems IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_gems < 50 THEN
    RAISE EXCEPTION 'Not enough gems';
  END IF;

  IF v_hearts >= 5 THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET gems = gems - 50,
      hearts = 5,
      updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION refill_hearts FROM anon;
GRANT EXECUTE ON FUNCTION refill_hearts TO authenticated;


-- ─── Lock profiles: revoke ALL update, grant only safe columns ──
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, learning_goal, daily_goal_minutes, daily_goal_xp, cefr_level, native_language) ON profiles TO authenticated;
