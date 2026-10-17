-- ============================================================================
-- Migration: 20261017114000_stage3_flashcard_review_and_practice.sql
-- Description: Stage 3.6 Spaced Repetition (SM-2) Flashcard System:
--   1. review_flashcard RPC: updates SM-2 repetition, interval, and easiness factor.
--   2. complete_flashcard_session RPC: awards 1 heart (up to 5 max) and XP for practicing.
--   3. get_due_flashcards RPC: fetches cards due for review or unreviewed vocabulary.
-- ============================================================================

-- 1. review_flashcard RPC
CREATE OR REPLACE FUNCTION public.review_flashcard(
  p_vocabulary_id uuid,
  p_grade int -- 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_rec record;
  v_interval int;
  v_repetitions int;
  v_easiness numeric;
  v_next_date date;
  v_q int; -- mapped to 0-5 scale for SM-2
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_grade NOT BETWEEN 1 AND 4 THEN
    RAISE EXCEPTION 'Invalid rating grade. Must be between 1 and 4';
  END IF;

  -- Map 1..4 to SM-2 scale 2..5 (1=2/fail-repeat, 2=3/hard, 3=4/good, 4=5/easy)
  v_q := p_grade + 1;

  -- Fetch existing review record if any
  SELECT sm2_interval, sm2_repetitions, sm2_easiness_factor
  INTO v_rec
  FROM public.flashcard_reviews
  WHERE user_id = v_user_id AND vocabulary_id = p_vocabulary_id;

  IF FOUND THEN
    v_interval := v_rec.sm2_interval;
    v_repetitions := v_rec.sm2_repetitions;
    v_easiness := v_rec.sm2_easiness_factor;
  ELSE
    v_interval := 0;
    v_repetitions := 0;
    v_easiness := 2.5;
  END IF;

  -- Calculate SM-2
  IF v_q < 3 THEN
    v_repetitions := 0;
    v_interval := 1;
  ELSE
    IF v_repetitions = 0 THEN
      v_interval := 1;
    ELSIF v_repetitions = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := round(v_interval * v_easiness);
    END IF;
    v_repetitions := v_repetitions + 1;
  END IF;

  -- Easiness factor update formula
  v_easiness := GREATEST(1.3, v_easiness + (0.1 - (5 - v_q) * (0.08 + (5 - v_q) * 0.02)));
  v_next_date := CURRENT_DATE + v_interval;

  -- Upsert review record
  INSERT INTO public.flashcard_reviews (
    user_id,
    vocabulary_id,
    sm2_interval,
    sm2_repetitions,
    sm2_easiness_factor,
    sm2_next_review_date,
    sm2_last_review_date,
    updated_at
  )
  VALUES (
    v_user_id,
    p_vocabulary_id,
    v_interval,
    v_repetitions,
    v_easiness,
    v_next_date,
    CURRENT_DATE,
    now()
  )
  ON CONFLICT (user_id, vocabulary_id)
  DO UPDATE SET
    sm2_interval = EXCLUDED.sm2_interval,
    sm2_repetitions = EXCLUDED.sm2_repetitions,
    sm2_easiness_factor = EXCLUDED.sm2_easiness_factor,
    sm2_next_review_date = EXCLUDED.sm2_next_review_date,
    sm2_last_review_date = EXCLUDED.sm2_last_review_date,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'next_review_date', v_next_date,
    'interval', v_interval,
    'repetitions', v_repetitions
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_flashcard(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_flashcard(uuid, int) TO authenticated;


-- 2. complete_flashcard_session RPC
CREATE OR REPLACE FUNCTION public.complete_flashcard_session(p_reviewed_count int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_current_hearts int;
  v_new_hearts int;
  v_heart_awarded boolean := false;
  v_xp_awarded int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_reviewed_count < 1 THEN
    RAISE EXCEPTION 'Reviewed count must be at least 1';
  END IF;

  SELECT hearts INTO v_current_hearts
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  -- If user has less than 5 hearts, recover 1 heart upon completing practice session
  IF v_current_hearts < 5 THEN
    v_new_hearts := v_current_hearts + 1;
    v_heart_awarded := true;
    UPDATE public.profiles
    SET hearts = v_new_hearts, updated_at = now()
    WHERE id = v_user_id;
  ELSE
    v_new_hearts := v_current_hearts;
  END IF;

  -- Award 10 XP for the practice session
  PERFORM public.award_xp(10, 'flashcards');
  v_xp_awarded := 10;

  -- Check achievements
  PERFORM public.check_achievements();

  RETURN jsonb_build_object(
    'success', true,
    'hearts', v_new_hearts,
    'heart_awarded', v_heart_awarded,
    'xp_awarded', v_xp_awarded
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_flashcard_session(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_flashcard_session(int) TO authenticated;


-- 3. get_due_flashcards RPC
CREATE OR REPLACE FUNCTION public.get_due_flashcards(p_limit int DEFAULT 20)
RETURNS TABLE (
  vocabulary_id uuid,
  persian_script text,
  arabic_meaning text,
  latin_transliteration text,
  audio_url text,
  part_of_speech text,
  sm2_interval int,
  sm2_repetitions int,
  is_due boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    v.id AS vocabulary_id,
    v.persian_script,
    v.arabic_meaning,
    v.latin_transliteration,
    v.audio_url,
    v.part_of_speech,
    COALESCE(fr.sm2_interval, 0) AS sm2_interval,
    COALESCE(fr.sm2_repetitions, 0) AS sm2_repetitions,
    (fr.sm2_next_review_date IS NULL OR fr.sm2_next_review_date <= CURRENT_DATE) AS is_due
  FROM public.vocabulary v
  LEFT JOIN public.flashcard_reviews fr
    ON fr.vocabulary_id = v.id AND fr.user_id = v_user_id
  WHERE v.needs_review = false OR v.needs_review IS NULL
  ORDER BY
    -- Prioritize due cards, then unreviewed cards, then lowest interval
    CASE
      WHEN fr.sm2_next_review_date IS NOT NULL AND fr.sm2_next_review_date <= CURRENT_DATE THEN 1
      WHEN fr.id IS NULL THEN 2
      ELSE 3
    END ASC,
    COALESCE(fr.sm2_interval, 0) ASC,
    v.created_at ASC
  LIMIT p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_due_flashcards(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_due_flashcards(int) TO authenticated;
