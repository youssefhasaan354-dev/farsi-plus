/*
# Create core schema: profiles, content tables, and user data tables

## Overview
Creates the foundational database schema for Farsi Plus (فارسي بلس), a Persian language-learning app for Arabic speakers.
Two categories of tables:
1. Content tables — curriculum data (stages, units, lessons, exercises, vocabulary) readable by all authenticated users, writable only by admins.
2. User data tables — per-user data (profiles, progress, XP, streaks, achievements, flashcards, mistakes, quests, leaderboard, reports, subscriptions, ad_settings) scoped to each user's own rows.

## New Tables

### Content Tables
- stages: CEFR levels (A0–C1)
- units: units within a stage
- lessons: lessons within a unit
- exercises: individual exercises (12 types)
- vocabulary: words with Persian script, transliterations, translations, audio, Arabic-loanword flag

### User Data Tables
- profiles: user profile with XP, hearts, gems, streak, role, premium flag
- user_progress: lesson completion and scores
- user_xp_log: XP earnings log for heatmap/analytics
- streaks: daily streak tracking
- achievements: catalog of badges (public read)
- user_achievements: earned achievements (owner-scoped)
- flashcard_reviews: SM-2 spaced repetition data
- mistakes: wrong answers for review mode
- daily_quests: daily tasks
- leaderboard_weekly: weekly leaderboard (public read)
- reports: user error reports on exercises
- subscriptions: Stripe-ready premium subscriptions
- ad_settings: user ad consent

## Security
- RLS on ALL tables
- Content tables: SELECT for authenticated, write for admin only (via is_admin() function)
- User tables: full CRUD scoped to auth.uid() = user_id, DEFAULT auth.uid() on owner columns
- Column-level privileges on profiles: users can only update non-sensitive columns
- SECURITY DEFINER functions: is_admin() and award_xp()
*/

-- ─── Profiles table (must come before is_admin) ────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  native_language text NOT NULL DEFAULT 'ar',
  learning_goal text,
  daily_goal_minutes int NOT NULL DEFAULT 15,
  daily_goal_xp int NOT NULL DEFAULT 75,
  cefr_level text NOT NULL DEFAULT 'A0' CHECK (cefr_level IN ('A0','A1','A2','B1','B2','C1')),
  is_premium boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  total_xp int NOT NULL DEFAULT 0,
  hearts int NOT NULL DEFAULT 5,
  gems int NOT NULL DEFAULT 50,
  streak_count int NOT NULL DEFAULT 0,
  streak_freeze_count int NOT NULL DEFAULT 1,
  last_study_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Column-level: users can only update their own non-sensitive columns
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, learning_goal, daily_goal_minutes, daily_goal_xp, cefr_level, native_language) ON profiles TO authenticated;

-- ─── Helper: is_admin ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ─── Content Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cefr_level text NOT NULL CHECK (cefr_level IN ('A0','A1','A2','B1','B2','C1')),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_fa text NOT NULL,
  description_ar text,
  description_en text,
  sort_order int NOT NULL DEFAULT 0,
  icon text,
  source text,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stages_select_authenticated" ON stages;
CREATE POLICY "stages_select_authenticated" ON stages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "stages_insert_admin" ON stages;
CREATE POLICY "stages_insert_admin" ON stages FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "stages_update_admin" ON stages;
CREATE POLICY "stages_update_admin" ON stages FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "stages_delete_admin" ON stages;
CREATE POLICY "stages_delete_admin" ON stages FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_fa text NOT NULL,
  description_ar text,
  description_en text,
  sort_order int NOT NULL DEFAULT 0,
  icon text,
  source text,
  needs_review boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "units_select_authenticated" ON units;
CREATE POLICY "units_select_authenticated" ON units FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "units_insert_admin" ON units;
CREATE POLICY "units_insert_admin" ON units FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "units_update_admin" ON units;
CREATE POLICY "units_update_admin" ON units FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "units_delete_admin" ON units;
CREATE POLICY "units_delete_admin" ON units FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  title_fa text NOT NULL,
  description_ar text,
  description_en text,
  sort_order int NOT NULL DEFAULT 0,
  icon text,
  xp_reward int NOT NULL DEFAULT 10,
  grammar_note_ar text,
  grammar_note_en text,
  cultural_note_ar text,
  cultural_note_en text,
  source text,
  needs_review boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_select_authenticated" ON lessons;
CREATE POLICY "lessons_select_authenticated" ON lessons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lessons_insert_admin" ON lessons;
CREATE POLICY "lessons_insert_admin" ON lessons FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "lessons_update_admin" ON lessons;
CREATE POLICY "lessons_update_admin" ON lessons FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "lessons_delete_admin" ON lessons;
CREATE POLICY "lessons_delete_admin" ON lessons FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'multiple_choice', 'word_matching', 'translation',
    'sentence_building', 'listening', 'fill_blank',
    'pronunciation', 'letter_tracing', 'typing_persian',
    'picture_word', 'dialogue_roleplay', 'story_reading'
  )),
  question_ar text,
  question_en text,
  question_fa text,
  data jsonb NOT NULL DEFAULT '{}',
  correct_answer jsonb,
  hints_ar text,
  hints_en text,
  sort_order int NOT NULL DEFAULT 0,
  source text,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercises_select_authenticated" ON exercises;
CREATE POLICY "exercises_select_authenticated" ON exercises FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "exercises_insert_admin" ON exercises;
CREATE POLICY "exercises_insert_admin" ON exercises FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "exercises_update_admin" ON exercises;
CREATE POLICY "exercises_update_admin" ON exercises FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "exercises_delete_admin" ON exercises;
CREATE POLICY "exercises_delete_admin" ON exercises FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES stages(id) ON DELETE SET NULL,
  persian_script text NOT NULL,
  latin_transliteration text NOT NULL,
  arabic_transliteration text,
  arabic_meaning text NOT NULL,
  english_meaning text NOT NULL,
  audio_url text,
  part_of_speech text,
  is_arabic_loanword boolean NOT NULL DEFAULT false,
  arabic_origin_note text,
  tags text[] DEFAULT '{}',
  source text,
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vocabulary_select_authenticated" ON vocabulary;
CREATE POLICY "vocabulary_select_authenticated" ON vocabulary FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vocabulary_insert_admin" ON vocabulary;
CREATE POLICY "vocabulary_insert_admin" ON vocabulary FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "vocabulary_update_admin" ON vocabulary;
CREATE POLICY "vocabulary_update_admin" ON vocabulary FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "vocabulary_delete_admin" ON vocabulary;
CREATE POLICY "vocabulary_delete_admin" ON vocabulary FOR DELETE TO authenticated USING (is_admin());

-- ─── User Data Tables ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','locked')),
  score int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_progress_select_own" ON user_progress;
CREATE POLICY "user_progress_select_own" ON user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_insert_own" ON user_progress;
CREATE POLICY "user_progress_insert_own" ON user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_update_own" ON user_progress;
CREATE POLICY "user_progress_update_own" ON user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_progress_delete_own" ON user_progress;
CREATE POLICY "user_progress_delete_own" ON user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_xp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount int NOT NULL,
  source text NOT NULL DEFAULT 'lesson',
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_xp_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "xp_log_select_own" ON user_xp_log;
CREATE POLICY "xp_log_select_own" ON user_xp_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "xp_log_insert_own" ON user_xp_log;
CREATE POLICY "xp_log_insert_own" ON user_xp_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "xp_log_update_own" ON user_xp_log;
CREATE POLICY "xp_log_update_own" ON user_xp_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "xp_log_delete_own" ON user_xp_log;
CREATE POLICY "xp_log_delete_own" ON user_xp_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  study_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_earned int NOT NULL DEFAULT 0,
  used_freeze boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, study_date)
);
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "streaks_select_own" ON streaks;
CREATE POLICY "streaks_select_own" ON streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_insert_own" ON streaks;
CREATE POLICY "streaks_insert_own" ON streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_update_own" ON streaks;
CREATE POLICY "streaks_update_own" ON streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "streaks_delete_own" ON streaks;
CREATE POLICY "streaks_delete_own" ON streaks FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text,
  description_en text,
  icon text,
  xp_reward int NOT NULL DEFAULT 0,
  gem_reward int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_select_authenticated" ON achievements;
CREATE POLICY "achievements_select_authenticated" ON achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "achievements_insert_admin" ON achievements;
CREATE POLICY "achievements_insert_admin" ON achievements FOR INSERT TO authenticated WITH CHECK (is_admin());
DROP POLICY IF EXISTS "achievements_update_admin" ON achievements;
CREATE POLICY "achievements_update_admin" ON achievements FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS "achievements_delete_admin" ON achievements;
CREATE POLICY "achievements_delete_admin" ON achievements FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_select_own" ON user_achievements;
CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_achievements_insert_own" ON user_achievements;
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_achievements_update_own" ON user_achievements;
CREATE POLICY "user_achievements_update_own" ON user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_achievements_delete_own" ON user_achievements;
CREATE POLICY "user_achievements_delete_own" ON user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id uuid NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  sm2_interval int NOT NULL DEFAULT 0,
  sm2_repetitions int NOT NULL DEFAULT 0,
  sm2_easiness_factor numeric NOT NULL DEFAULT 2.5,
  sm2_next_review_date date NOT NULL DEFAULT CURRENT_DATE,
  sm2_last_review_date date,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flashcard_reviews_select_own" ON flashcard_reviews;
CREATE POLICY "flashcard_reviews_select_own" ON flashcard_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "flashcard_reviews_insert_own" ON flashcard_reviews;
CREATE POLICY "flashcard_reviews_insert_own" ON flashcard_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "flashcard_reviews_update_own" ON flashcard_reviews;
CREATE POLICY "flashcard_reviews_update_own" ON flashcard_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "flashcard_reviews_delete_own" ON flashcard_reviews;
CREATE POLICY "flashcard_reviews_delete_own" ON flashcard_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_answer jsonb,
  correct_answer jsonb,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mistakes_select_own" ON mistakes;
CREATE POLICY "mistakes_select_own" ON mistakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "mistakes_insert_own" ON mistakes;
CREATE POLICY "mistakes_insert_own" ON mistakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "mistakes_update_own" ON mistakes;
CREATE POLICY "mistakes_update_own" ON mistakes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "mistakes_delete_own" ON mistakes;
CREATE POLICY "mistakes_delete_own" ON mistakes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type text NOT NULL,
  target_value int NOT NULL DEFAULT 1,
  current_value int NOT NULL DEFAULT 0,
  xp_reward int NOT NULL DEFAULT 10,
  gem_reward int NOT NULL DEFAULT 5,
  is_completed boolean NOT NULL DEFAULT false,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, quest_type, quest_date)
);
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_quests_select_own" ON daily_quests;
CREATE POLICY "daily_quests_select_own" ON daily_quests FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_quests_insert_own" ON daily_quests;
CREATE POLICY "daily_quests_insert_own" ON daily_quests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_quests_update_own" ON daily_quests;
CREATE POLICY "daily_quests_update_own" ON daily_quests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_quests_delete_own" ON daily_quests;
CREATE POLICY "daily_quests_delete_own" ON daily_quests FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  total_xp int NOT NULL DEFAULT 0,
  rank int,
  league text NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze','silver','gold','sapphire','ruby','diamond')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);
ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leaderboard_select_authenticated" ON leaderboard_weekly;
CREATE POLICY "leaderboard_select_authenticated" ON leaderboard_weekly FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leaderboard_insert_own" ON leaderboard_weekly;
CREATE POLICY "leaderboard_insert_own" ON leaderboard_weekly FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "leaderboard_update_own" ON leaderboard_weekly;
CREATE POLICY "leaderboard_update_own" ON leaderboard_weekly FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "leaderboard_delete_own" ON leaderboard_weekly;
CREATE POLICY "leaderboard_delete_own" ON leaderboard_weekly FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  vocabulary_id uuid REFERENCES vocabulary(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('error','suggestion','audio_issue','other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reports_update_own" ON reports;
CREATE POLICY "reports_update_own" ON reports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reports_delete_own" ON reports;
CREATE POLICY "reports_delete_own" ON reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','plus')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
CREATE POLICY "subscriptions_insert_own" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;
CREATE POLICY "subscriptions_update_own" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions_delete_own" ON subscriptions;
CREATE POLICY "subscriptions_delete_own" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ads_enabled boolean NOT NULL DEFAULT true,
  consent_given_at timestamptz,
  consent_version text,
  personalized_ads boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_settings_select_own" ON ad_settings;
CREATE POLICY "ad_settings_select_own" ON ad_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ad_settings_insert_own" ON ad_settings;
CREATE POLICY "ad_settings_insert_own" ON ad_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ad_settings_update_own" ON ad_settings;
CREATE POLICY "ad_settings_update_own" ON ad_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ad_settings_delete_own" ON ad_settings;
CREATE POLICY "ad_settings_delete_own" ON ad_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Privileged Function: award_xp ──────────────────────────────
CREATE OR REPLACE FUNCTION award_xp(p_xp_amount int, p_source text DEFAULT 'lesson', p_reference_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_xp_amount IS NULL OR p_xp_amount <= 0 OR p_xp_amount > 1000 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;
  INSERT INTO user_xp_log (user_id, xp_amount, source, reference_id)
  VALUES (auth.uid(), p_xp_amount, p_source, p_reference_id);
  UPDATE profiles SET total_xp = total_xp + p_xp_amount, updated_at = now()
  WHERE id = auth.uid();
END;
$$;
REVOKE EXECUTE ON FUNCTION award_xp FROM anon;
GRANT EXECUTE ON FUNCTION award_xp TO authenticated;

-- ─── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_units_stage_id ON units(stage_id);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson_id ON exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson_id ON vocabulary(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_stage_id ON vocabulary(stage_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_log_user_id ON user_xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_log_created_at ON user_xp_log(created_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_review ON flashcard_reviews(sm2_next_review_date);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_week_date ON leaderboard_weekly(week_start_date);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_settings_user_id ON ad_settings(user_id);
