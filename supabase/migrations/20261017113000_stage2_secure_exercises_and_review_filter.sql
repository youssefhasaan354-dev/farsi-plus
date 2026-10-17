-- ============================================================================
-- Migration: 20261017113000_stage2_secure_exercises_and_review_filter.sql
-- Description: Stage 2.6:
--   1. Filter exercises and vocabulary by needs_review = false for regular users.
--   2. RPC get_lesson_exercises to return exercises without correct_answer column.
-- ============================================================================

-- 1. Restrict exercises SELECT to reviewed rows only (or admins)
DROP POLICY IF EXISTS "exercises_select_authenticated" ON public.exercises;
CREATE POLICY "exercises_select_authenticated" ON public.exercises FOR SELECT
  TO authenticated
  USING (
    (needs_review = false) OR is_admin()
  );

-- 2. Restrict vocabulary SELECT to reviewed rows only (or admins)
DROP POLICY IF EXISTS "vocabulary_select_authenticated" ON public.vocabulary;
CREATE POLICY "vocabulary_select_authenticated" ON public.vocabulary FOR SELECT
  TO authenticated
  USING (
    (needs_review = false) OR is_admin()
  );

-- 3. get_lesson_exercises RPC (omits correct_answer column)
CREATE OR REPLACE FUNCTION public.get_lesson_exercises(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'lesson_id', e.lesson_id,
    'type', e.type,
    'question_ar', e.question_ar,
    'question_en', e.question_en,
    'data', e.data,
    'hints_ar', e.hints_ar,
    'hints_en', e.hints_en,
    'sort_order', e.sort_order
  ) ORDER BY e.sort_order), '[]'::jsonb)
  INTO v_result
  FROM public.exercises e
  WHERE e.lesson_id = p_lesson_id
    AND ((e.needs_review = false) OR is_admin());

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_lesson_exercises(uuid) TO authenticated;
