/*
# Phase 4B: Streaks, gems, shop, achievements, daily quests

## Overview
Adds timezone-aware streak logic with automatic streak freeze, a shop system with
gem purchases, 20 seeded achievements with auto-checking, and daily quest generation.
The complete_lesson function is rewritten to return rich JSON with streak/quest/achievement info.

## New Tables
- shop_items: catalog of purchasable items (streak_freeze, heart_refill, xp_booster)
- user_purchases: records of item purchases, owner-scoped
- user_boosters: active boosters with expiry timestamps

## Modified Tables
- profiles: adds timezone column (default 'Africa/Cairo')
- daily_quests: adds reward_claimed column
- achievements: adds sort_order column

## New Functions
- get_user_date(): returns user's current date in their timezone
- purchase_shop_item(): server-side purchase with balance check
- generate_daily_quests(): creates 3 daily quests if none exist for today
- claim_daily_quest_reward(): claims gem reward when all 3 quests completed
- check_achievements(): checks all achievement conditions after lesson completion
- get_streak_calendar(): returns last 7 days streak data

## Rewritten Functions
- complete_lesson(): now returns jsonb with xp, gems, streak, quest, achievement data

## Security
- All gem/heart/streak mutations go through SECURITY DEFINER functions only
- Shop purchases verify balance server-side, prevent negative gems
- Daily quest reward claim is atomic (can only claim once per day)
- Achievements table is public read; user_achievements and user_purchases are owner-scoped
*/

-- ─── Add timezone to profiles ────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
    ALTER TABLE profiles ADD COLUMN timezone text NOT NULL DEFAULT 'Africa/Cairo';
  END IF;
END $$;

-- Add sort_order to achievements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'sort_order') THEN
    ALTER TABLE achievements ADD COLUMN sort_order int NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add reward_claimed to daily_quests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_quests' AND column_name = 'reward_claimed') THEN
    ALTER TABLE daily_quests ADD COLUMN reward_claimed boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ─── Helper: get user's current date in their timezone ───────
CREATE OR REPLACE FUNCTION get_user_date()
RETURNS date
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT (now() AT TIME ZONE COALESCE(
    (SELECT timezone FROM profiles WHERE id = auth.uid()),
    'Africa/Cairo'
  ))::date;
$$;

REVOKE EXECUTE ON FUNCTION get_user_date FROM anon;
GRANT EXECUTE ON FUNCTION get_user_date TO authenticated;

-- ─── Shop items catalog table ────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  price_gems int NOT NULL,
  icon text NOT NULL DEFAULT 'ShoppingBag',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_items_select_authenticated" ON shop_items;
CREATE POLICY "shop_items_select_authenticated" ON shop_items FOR SELECT
  TO authenticated USING (true);

INSERT INTO shop_items (code, name_ar, name_en, description_ar, description_en, price_gems, icon, sort_order) VALUES
('streak_freeze', 'تجميد السلسلة', 'Streak Freeze', 'يحمي سلسلتك اليومية عند تفويت يوم واحد', 'Protects your daily streak when you miss one day', 60, 'Snowflake', 1),
('heart_refill', 'تعبئة القلوب', 'Heart Refill', 'يملأ قلوبك إلى ٥ فوراً', 'Refills your hearts to 5 instantly', 50, 'Heart', 2),
('xp_booster', 'مضاعف النقاط', 'Double XP Booster', 'يضاعف النقاط لمدة ١٥ دقيقة', 'Doubles XP for 15 minutes', 80, 'Zap', 3)
ON CONFLICT (code) DO NOTHING;

-- ─── User purchases table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_item_code text NOT NULL,
  gems_spent int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_purchases_select_own" ON user_purchases;
CREATE POLICY "user_purchases_select_own" ON user_purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_purchases_insert_own" ON user_purchases;
CREATE POLICY "user_purchases_insert_own" ON user_purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);

-- ─── User boosters table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_boosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_type text NOT NULL CHECK (booster_type IN ('xp_booster')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_boosters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_boosters_select_own" ON user_boosters;
CREATE POLICY "user_boosters_select_own" ON user_boosters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_boosters_insert_own" ON user_boosters;
CREATE POLICY "user_boosters_insert_own" ON user_boosters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_boosters_user_id ON user_boosters(user_id);

-- ─── Purchase shop item function ─────────────────────────────
CREATE OR REPLACE FUNCTION purchase_shop_item(p_item_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item shop_items%ROWTYPE;
  v_gems int;
  v_hearts int;
  v_streak_freeze int;
  v_result jsonb;
BEGIN
  SELECT * INTO v_item FROM shop_items WHERE code = p_item_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  SELECT gems, hearts, streak_freeze_count INTO v_gems, v_hearts, v_streak_freeze
  FROM profiles WHERE id = auth.uid();

  IF v_gems IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_gems < v_item.price_gems THEN
    RAISE EXCEPTION 'Not enough gems';
  END IF;

  IF p_item_code = 'heart_refill' THEN
    IF v_hearts >= 5 THEN
      RAISE EXCEPTION 'Hearts already full';
    END IF;
    UPDATE profiles SET gems = gems - v_item.price_gems, hearts = 5, updated_at = now()
    WHERE id = auth.uid();
    v_result := jsonb_build_object('success', true, 'hearts', 5, 'gems_spent', v_item.price_gems);

  ELSIF p_item_code = 'streak_freeze' THEN
    UPDATE profiles SET gems = gems - v_item.price_gems, streak_freeze_count = streak_freeze_count + 1, updated_at = now()
    WHERE id = auth.uid();
    v_result := jsonb_build_object('success', true, 'streak_freeze_count', v_streak_freeze + 1, 'gems_spent', v_item.price_gems);

  ELSIF p_item_code = 'xp_booster' THEN
    DELETE FROM user_boosters WHERE user_id = auth.uid() AND booster_type = 'xp_booster';
    INSERT INTO user_boosters (user_id, booster_type, expires_at)
    VALUES (auth.uid(), 'xp_booster', now() + interval '15 minutes');
    UPDATE profiles SET gems = gems - v_item.price_gems, updated_at = now()
    WHERE id = auth.uid();
    v_result := jsonb_build_object('success', true, 'expires_at', now() + interval '15 minutes', 'gems_spent', v_item.price_gems);

  ELSE
    RAISE EXCEPTION 'Unknown item code';
  END IF;

  INSERT INTO user_purchases (user_id, shop_item_code, gems_spent)
  VALUES (auth.uid(), p_item_code, v_item.price_gems);

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION purchase_shop_item FROM anon;
GRANT EXECUTE ON FUNCTION purchase_shop_item TO authenticated;

-- ─── Generate daily quests function ──────────────────────────
CREATE OR REPLACE FUNCTION generate_daily_quests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_today date;
  v_exists boolean;
BEGIN
  v_today := get_user_date();

  SELECT EXISTS(
    SELECT 1 FROM daily_quests
    WHERE user_id = auth.uid() AND quest_date = v_today
  ) INTO v_exists;

  IF v_exists THEN RETURN; END IF;

  INSERT INTO daily_quests (user_id, quest_type, target_value, current_value, xp_reward, gem_reward, is_completed, quest_date, reward_claimed)
  VALUES
    (auth.uid(), 'earn_xp', 20, 0, 10, 5, false, v_today, false),
    (auth.uid(), 'complete_lessons', 2, 0, 10, 5, false, v_today, false),
    (auth.uid(), 'perfect_lesson', 1, 0, 15, 10, false, v_today, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_daily_quests FROM anon;
GRANT EXECUTE ON FUNCTION generate_daily_quests TO authenticated;

-- ─── Claim daily quest reward function ───────────────────────
CREATE OR REPLACE FUNCTION claim_daily_quest_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_today date;
  v_all_completed boolean;
  v_already_claimed boolean;
  v_total_gems int;
  v_total_xp int;
BEGIN
  v_today := get_user_date();

  SELECT
    bool_and(is_completed),
    bool_or(reward_claimed)
  INTO v_all_completed, v_already_claimed
  FROM daily_quests
  WHERE user_id = auth.uid() AND quest_date = v_today;

  IF v_already_claimed THEN
    RAISE EXCEPTION 'Reward already claimed today';
  END IF;

  IF NOT v_all_completed THEN
    RAISE EXCEPTION 'Not all quests completed';
  END IF;

  UPDATE daily_quests SET reward_claimed = true
  WHERE user_id = auth.uid() AND quest_date = v_today;

  SELECT coalesce(sum(gem_reward), 0), coalesce(sum(xp_reward), 0)
  INTO v_total_gems, v_total_xp
  FROM daily_quests
  WHERE user_id = auth.uid() AND quest_date = v_today;

  UPDATE profiles SET gems = gems + v_total_gems, updated_at = now()
  WHERE id = auth.uid();

  PERFORM award_xp(v_total_xp, 'quest');

  RETURN jsonb_build_object('success', true, 'gems_earned', v_total_gems, 'xp_earned', v_total_xp);
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_daily_quest_reward FROM anon;
GRANT EXECUTE ON FUNCTION claim_daily_quest_reward TO authenticated;

-- ─── Get streak calendar function ────────────────────────────
CREATE OR REPLACE FUNCTION get_streak_calendar()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tz text;
  v_today date;
  v_result jsonb;
BEGIN
  SELECT timezone INTO v_tz FROM profiles WHERE id = auth.uid();
  v_tz := COALESCE(v_tz, 'Africa/Cairo');
  v_today := (now() AT TIME ZONE v_tz)::date;

  SELECT jsonb_agg(
    jsonb_build_object(
      'date', d,
      'studied', EXISTS(
        SELECT 1 FROM streaks
        WHERE user_id = auth.uid() AND study_date = d
      ),
      'is_today', d = v_today
    ) ORDER BY d
  ) INTO v_result
  FROM generate_series(v_today - 6, v_today, interval '1 day') AS d;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_streak_calendar FROM anon;
GRANT EXECUTE ON FUNCTION get_streak_calendar TO authenticated;

-- ─── Seed 20 achievements ────────────────────────────────────
INSERT INTO achievements (code, title_ar, title_en, description_ar, description_en, icon, xp_reward, gem_reward, sort_order) VALUES
('first_lesson', 'الدرس الأول', 'First Lesson', 'أكملت أول درس لك', 'Completed your first lesson', 'GraduationCap', 20, 10, 1),
('lessons_3', 'ثلاثة دروس', 'Three Lessons', 'أكملت ٣ دروس', 'Completed 3 lessons', 'BookCheck', 30, 10, 2),
('streak_3', 'سلسلة ٣ أيام', '3-Day Streak', 'درست ٣ أيام متتالية', 'Studied 3 days in a row', 'Flame', 30, 15, 3),
('xp_100', '١٠٠ نقطة', '100 XP', 'وصلت إلى ١٠٠ نقطة', 'Reached 100 XP', 'Star', 20, 10, 4),
('perfect_lesson', 'درس مثالي', 'Perfect Lesson', 'أكملت درساً بنسبة ١٠٠٪', 'Completed a lesson with 100% accuracy', 'CheckCircle2', 25, 15, 5),
('lessons_10', 'عشرة دروس', '10 Lessons', 'أكملت ١٠ دروس', 'Completed 10 lessons', 'Award', 50, 20, 6),
('streak_7', 'سلسلة أسبوع', '7-Day Streak', 'درست ٧ أيام متتالية', 'Studied 7 days in a row', 'Flame', 50, 25, 7),
('early_bird', 'طائر الصباح', 'Early Bird', 'درست قبل الساعة ٧ صباحاً', 'Studied before 7 AM', 'Sunrise', 20, 10, 8),
('night_owl', 'بومة الليل', 'Night Owl', 'درست بعد الساعة ١٠ مساءً', 'Studied after 10 PM', 'Moon', 20, 10, 9),
('xp_500', '٥٠٠ نقطة', '500 XP', 'وصلت إلى ٥٠٠ نقطة', 'Reached 500 XP', 'Star', 50, 25, 10),
('perfect_5', 'خمسة دروس مثالية', '5 Perfect Lessons', 'أكملت ٥ دروس بنسبة ١٠٠٪', 'Completed 5 lessons with 100%', 'Trophy', 50, 25, 11),
('stage1_letters', 'أبجدية المرحلة ١', 'Stage 1 Letters', 'أكملت ٣٠ درساً في المرحلة الأولى', 'Completed 30 lessons in Stage 1', 'Type', 100, 50, 12),
('streak_10', 'سلسلة ١٠ أيام', '10-Day Streak', 'درست ١٠ أيام متتالية', 'Studied 10 days in a row', 'Flame', 75, 30, 13),
('gems_100', '١٠٠ جوهرة', '100 Gems', 'جمعت ١٠٠ جوهرة', 'Collected 100 gems', 'Gem', 30, 0, 14),
('streak_30', 'سلسلة شهر', '30-Day Streak', 'درست ٣٠ يوماً متتالياً', 'Studied 30 days in a row', 'Flame', 150, 50, 15),
('xp_1000', '١٠٠٠ نقطة', '1000 XP', 'وصلت إلى ١٠٠٠ نقطة', 'Reached 1000 XP', 'Star', 100, 50, 16),
('lessons_25', '٢٥ درساً', '25 Lessons', 'أكملت ٢٥ درساً', 'Completed 25 lessons', 'Award', 100, 40, 17),
('streak_50', 'سلسلة ٥٠ يوماً', '50-Day Streak', 'درست ٥٠ يوماً متتالياً', 'Studied 50 days in a row', 'Flame', 200, 100, 18),
('xp_5000', '٥٠٠٠ نقطة', '5000 XP', 'وصلت إلى ٥٠٠٠ نقطة', 'Reached 5000 XP', 'Star', 200, 100, 19),
('lessons_50', '٥٠ درساً', '50 Lessons', 'أكملت ٥٠ درساً', 'Completed 50 lessons', 'Trophy', 200, 100, 20)
ON CONFLICT (code) DO NOTHING;

-- ─── Check achievements function ─────────────────────────────
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_lessons_completed int;
  v_perfect_lessons int;
  v_stage1_lessons int;
  v_new_achievements jsonb;
  v_achievement achievements%ROWTYPE;
  v_already_earned boolean;
  v_study_hour int;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  IF v_profile.id IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT count(*) INTO v_lessons_completed
  FROM user_progress WHERE user_id = auth.uid() AND status = 'completed';

  SELECT count(*) INTO v_perfect_lessons
  FROM user_progress WHERE user_id = auth.uid() AND status = 'completed' AND score = 100;

  SELECT count(*) INTO v_stage1_lessons
  FROM user_progress up
  JOIN lessons l ON up.lesson_id = l.id
  WHERE up.user_id = auth.uid() AND up.status = 'completed'
    AND l.unit_id IN (SELECT id FROM units WHERE stage_id = '00000000-0000-0000-0000-000000000001');

  v_study_hour := extract(hour FROM (now() AT TIME ZONE COALESCE(v_profile.timezone, 'Africa/Cairo')));
  v_new_achievements := '[]'::jsonb;

  FOR v_achievement IN SELECT * FROM achievements ORDER BY sort_order LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = auth.uid() AND achievement_id = v_achievement.id
    ) INTO v_already_earned;

    IF v_already_earned THEN CONTINUE; END IF;

    IF (v_achievement.code = 'first_lesson' AND v_lessons_completed >= 1)
       OR (v_achievement.code = 'streak_3' AND v_profile.streak_count >= 3)
       OR (v_achievement.code = 'streak_7' AND v_profile.streak_count >= 7)
       OR (v_achievement.code = 'streak_10' AND v_profile.streak_count >= 10)
       OR (v_achievement.code = 'streak_30' AND v_profile.streak_count >= 30)
       OR (v_achievement.code = 'streak_50' AND v_profile.streak_count >= 50)
       OR (v_achievement.code = 'xp_100' AND v_profile.total_xp >= 100)
       OR (v_achievement.code = 'xp_500' AND v_profile.total_xp >= 500)
       OR (v_achievement.code = 'xp_1000' AND v_profile.total_xp >= 1000)
       OR (v_achievement.code = 'xp_5000' AND v_profile.total_xp >= 5000)
       OR (v_achievement.code = 'perfect_lesson' AND v_perfect_lessons >= 1)
       OR (v_achievement.code = 'perfect_5' AND v_perfect_lessons >= 5)
       OR (v_achievement.code = 'lessons_3' AND v_lessons_completed >= 3)
       OR (v_achievement.code = 'lessons_10' AND v_lessons_completed >= 10)
       OR (v_achievement.code = 'lessons_25' AND v_lessons_completed >= 25)
       OR (v_achievement.code = 'lessons_50' AND v_lessons_completed >= 50)
       OR (v_achievement.code = 'stage1_letters' AND v_stage1_lessons >= 30)
       OR (v_achievement.code = 'night_owl' AND v_study_hour >= 22)
       OR (v_achievement.code = 'early_bird' AND v_study_hour < 7)
       OR (v_achievement.code = 'gems_100' AND v_profile.gems >= 100)
    THEN
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (auth.uid(), v_achievement.id) ON CONFLICT DO NOTHING;
      v_new_achievements := v_new_achievements || jsonb_build_object(
        'code', v_achievement.code,
        'title_ar', v_achievement.title_ar,
        'title_en', v_achievement.title_en,
        'icon', v_achievement.icon,
        'xp_reward', v_achievement.xp_reward,
        'gem_reward', v_achievement.gem_reward
      );
    END IF;
  END LOOP;

  -- Award rewards for new achievements
  IF v_new_achievements::text != '[]' THEN
    DECLARE
      v_ach jsonb;
    BEGIN
      FOR v_ach IN SELECT * FROM jsonb_array_elements(v_new_achievements) LOOP
        UPDATE profiles
        SET gems = gems + (v_ach->>'gem_reward')::int,
            total_xp = total_xp + (v_ach->>'xp_reward')::int,
            updated_at = now()
        WHERE id = auth.uid();

        INSERT INTO user_xp_log (user_id, xp_amount, source)
        VALUES (auth.uid(), (v_ach->>'xp_reward')::int, 'achievement');
      END LOOP;
    END;
  END IF;

  RETURN v_new_achievements;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_achievements FROM anon;
GRANT EXECUTE ON FUNCTION check_achievements TO authenticated;

-- ─── Drop and recreate complete_lesson with rich return ──────
DROP FUNCTION IF EXISTS complete_lesson(uuid, int);

CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id uuid, p_score int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_xp_awarded int;
  v_user_date date;
  v_last_study date;
  v_streak_extended boolean := false;
  v_freeze_used boolean := false;
  v_has_booster boolean;
  v_gem_reward int;
  v_result jsonb;
  v_new_achievements jsonb;
BEGIN
  IF p_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Lesson ID required';
  END IF;

  IF p_score IS NULL OR p_score < 0 OR p_score > 100 THEN
    p_score := 0;
  END IF;

  v_user_date := get_user_date();

  -- Upsert progress
  INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at, attempts, updated_at)
  VALUES (auth.uid(), p_lesson_id, 'completed', p_score, now(), 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET status = 'completed', score = GREATEST(user_progress.score, p_score),
    completed_at = now(), updated_at = now(),
    attempts = user_progress.attempts + 1;

  -- Check for active XP booster
  SELECT EXISTS(
    SELECT 1 FROM user_boosters
    WHERE user_id = auth.uid() AND booster_type = 'xp_booster' AND expires_at > now()
  ) INTO v_has_booster;

  -- Award XP (server-side, deduplicated)
  SELECT award_xp(NULL, 'lesson', p_lesson_id) INTO v_xp_awarded;

  -- Double XP if booster active
  IF v_has_booster AND v_xp_awarded > 0 THEN
    UPDATE profiles SET total_xp = total_xp + v_xp_awarded, updated_at = now() WHERE id = auth.uid();
    INSERT INTO user_xp_log (user_id, xp_amount, source, reference_id)
    VALUES (auth.uid(), v_xp_awarded, 'booster', p_lesson_id);
  END IF;

  -- Gem reward: 2 gems per lesson, bonus for perfect
  v_gem_reward := 2;
  IF p_score = 100 THEN
    v_gem_reward := v_gem_reward + 3;
  END IF;
  UPDATE profiles SET gems = gems + v_gem_reward, updated_at = now() WHERE id = auth.uid();

  -- Streak logic (timezone-aware)
  SELECT last_study_date INTO v_last_study FROM profiles WHERE id = auth.uid();

  IF v_last_study IS NULL OR v_last_study < v_user_date THEN
    IF v_last_study IS NOT NULL AND v_last_study < v_user_date - 1 THEN
      -- Missed a day — try streak freeze
      DECLARE
        v_freeze_count int;
      BEGIN
        SELECT streak_freeze_count INTO v_freeze_count FROM profiles WHERE id = auth.uid();
        IF v_freeze_count > 0 THEN
          UPDATE profiles
          SET streak_freeze_count = streak_freeze_count - 1,
              streak_count = streak_count + 1,
              last_study_date = v_user_date,
              hearts = LEAST(hearts + 1, 5),
              updated_at = now()
          WHERE id = auth.uid();
          v_freeze_used := true;
          v_streak_extended := true;
        ELSE
          UPDATE profiles
          SET streak_count = 1,
              last_study_date = v_user_date,
              hearts = LEAST(hearts + 1, 5),
              updated_at = now()
          WHERE id = auth.uid();
          v_streak_extended := true;
        END IF;
      END;
    ELSIF v_last_study IS NULL THEN
      UPDATE profiles
      SET streak_count = 1, last_study_date = v_user_date,
          hearts = LEAST(hearts + 1, 5), updated_at = now()
      WHERE id = auth.uid();
      v_streak_extended := true;
    ELSE
      UPDATE profiles
      SET streak_count = streak_count + 1, last_study_date = v_user_date,
          hearts = LEAST(hearts + 1, 5), updated_at = now()
      WHERE id = auth.uid();
      v_streak_extended := true;
    END IF;
  ELSIF v_last_study = v_user_date THEN
    UPDATE profiles
    SET hearts = LEAST(hearts + 1, 5), updated_at = now()
    WHERE id = auth.uid() AND hearts < 5;
  END IF;

  -- Record streak
  INSERT INTO streaks (user_id, study_date, xp_earned)
  VALUES (auth.uid(), v_user_date, v_xp_awarded)
  ON CONFLICT (user_id, study_date)
  DO UPDATE SET xp_earned = streaks.xp_earned + v_xp_awarded;

  -- Update daily quests
  UPDATE daily_quests
  SET current_value = current_value + v_xp_awarded,
      is_completed = current_value + v_xp_awarded >= target_value
  WHERE user_id = auth.uid() AND quest_type = 'earn_xp'
    AND quest_date = v_user_date AND is_completed = false;

  UPDATE daily_quests
  SET current_value = current_value + 1,
      is_completed = current_value + 1 >= target_value
  WHERE user_id = auth.uid() AND quest_type = 'complete_lessons'
    AND quest_date = v_user_date AND is_completed = false;

  IF p_score = 100 THEN
    UPDATE daily_quests
    SET current_value = current_value + 1,
        is_completed = current_value + 1 >= target_value
    WHERE user_id = auth.uid() AND quest_type = 'perfect_lesson'
      AND quest_date = v_user_date AND is_completed = false;
  END IF;

  -- Check achievements
  SELECT check_achievements() INTO v_new_achievements;

  v_result := jsonb_build_object(
    'xp_awarded', v_xp_awarded,
    'gem_reward', v_gem_reward,
    'streak_extended', v_streak_extended,
    'freeze_used', v_freeze_used,
    'booster_active', v_has_booster,
    'new_achievements', v_new_achievements,
    'streak_count', (SELECT streak_count FROM profiles WHERE id = auth.uid())
  );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION complete_lesson FROM anon;
GRANT EXECUTE ON FUNCTION complete_lesson TO authenticated;

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON daily_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_user_boosters_active ON user_boosters(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user_date ON streaks(user_id, study_date);
