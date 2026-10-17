-- Migration: 20261017130000_stage5_add_missing_indexes.sql
-- Description: Add missing performance indexes for frequently queried game and content tables

-- 1. User Progress querying by user and completion status
CREATE INDEX IF NOT EXISTS idx_user_progress_user_status 
  ON public.user_progress(user_id, status);

-- 2. User XP Log by user ordered by created_at
CREATE INDEX IF NOT EXISTS idx_user_xp_log_user_created 
  ON public.user_xp_log(user_id, created_at DESC);

-- 3. Leaderboard weekly rankings by week, league and rank
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_week_league_rank 
  ON public.leaderboard_weekly(week_start_date, league, rank);

-- 4. Exercises ordering by lesson and sort_order
CREATE INDEX IF NOT EXISTS idx_exercises_lesson_sort 
  ON public.exercises(lesson_id, sort_order);

-- 5. Additional relational navigation indexes
CREATE INDEX IF NOT EXISTS idx_lessons_unit_sort 
  ON public.lessons(unit_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_units_stage_sort 
  ON public.units(stage_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson 
  ON public.vocabulary(lesson_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due 
  ON public.flashcard_reviews(user_id, sm2_next_review_date);
