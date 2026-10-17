-- ============================================================================
-- Migration: 20261017112000_stage2_fix_rpcs_and_leagues.sql
-- Description: Stage 2.4 Function Fixes:
-- Drop existing functions first: return types changed, so CREATE OR REPLACE would fail (42P13)
DROP FUNCTION IF EXISTS public.claim_daily_quest_reward();
DROP FUNCTION IF EXISTS public.purchase_shop_item(text);
DROP FUNCTION IF EXISTS public.refill_hearts();
DROP FUNCTION IF EXISTS public.check_achievements();
DROP FUNCTION IF EXISTS public.get_streak_calendar();
DROP FUNCTION IF EXISTS public.compute_weekly_leagues();
DROP FUNCTION IF EXISTS public.get_weekly_leaderboard();
--   1. claim_daily_quest_reward: atomic update, handle missing quests, prevent race conditions.
--   2. purchase_shop_item: FOR UPDATE lock, cap streak freeze at 3.
--   3. refill_hearts: return jsonb, read dynamic price from shop_items.
--   4. check_achievements: explicit hour int cast, batched rewards update.
--   5. get_streak_calendar: explicit d::date cast.
--   6. compute_weekly_leagues & get_weekly_leaderboard: compute from user_xp_log weekly XP.
-- ============================================================================

-- 1. claim_daily_quest_reward
CREATE OR REPLACE FUNCTION public.claim_daily_quest_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today date;
  v_quest_count int;
  v_completed_count int;
  v_already_claimed boolean;
  v_total_gems int;
  v_total_xp int;
  v_updated_rows int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_today := get_user_date();

  -- Check if quests exist for today, if not generate them
  SELECT count(*) INTO v_quest_count
  FROM public.daily_quests
  WHERE user_id = auth.uid() AND quest_date = v_today;

  IF v_quest_count = 0 THEN
    PERFORM public.generate_daily_quests();
    SELECT count(*) INTO v_quest_count
    FROM public.daily_quests
    WHERE user_id = auth.uid() AND quest_date = v_today;
  END IF;

  IF v_quest_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_quests_today');
  END IF;

  SELECT
    count(*) FILTER (WHERE is_completed = true),
    bool_or(reward_claimed)
  INTO v_completed_count, v_already_claimed
  FROM public.daily_quests
  WHERE user_id = auth.uid() AND quest_date = v_today;

  IF v_already_claimed IS TRUE THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  IF v_completed_count < v_quest_count THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_all_completed');
  END IF;

  -- Atomic claim to prevent race conditions
  UPDATE public.daily_quests
  SET reward_claimed = true
  WHERE user_id = auth.uid() AND quest_date = v_today AND reward_claimed = false;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  SELECT COALESCE(sum(gem_reward), 0), COALESCE(sum(xp_reward), 0)
  INTO v_total_gems, v_total_xp
  FROM public.daily_quests
  WHERE user_id = auth.uid() AND quest_date = v_today;

  UPDATE public.profiles
  SET gems = gems + v_total_gems,
      total_xp = total_xp + v_total_xp,
      updated_at = now()
  WHERE id = auth.uid();

  IF v_total_xp > 0 THEN
    INSERT INTO public.user_xp_log (user_id, xp_amount, source)
    VALUES (auth.uid(), v_total_xp, 'quest');
  END IF;

  RETURN jsonb_build_object('success', true, 'gems_earned', v_total_gems, 'xp_earned', v_total_xp);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_daily_quest_reward FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_daily_quest_reward FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_quest_reward TO authenticated;

-- 2. purchase_shop_item
CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_item_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item public.shop_items%ROWTYPE;
  v_gems int;
  v_hearts int;
  v_streak_freeze int;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_item FROM public.shop_items WHERE code = p_item_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- Lock user row with SELECT ... FOR UPDATE to prevent race conditions
  SELECT gems, hearts, streak_freeze_count
  INTO v_gems, v_hearts, v_streak_freeze
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_gems < v_item.price_gems THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_enough_gems');
  END IF;

  IF p_item_code = 'heart_refill' THEN
    IF v_hearts >= 5 THEN
      RETURN jsonb_build_object('success', false, 'reason', 'hearts_already_full');
    END IF;

    UPDATE public.profiles
    SET gems = gems - v_item.price_gems,
        hearts = 5,
        hearts_updated_at = now(),
        updated_at = now()
    WHERE id = auth.uid();

    v_result := jsonb_build_object('success', true, 'hearts', 5, 'gems_spent', v_item.price_gems);

  ELSIF p_item_code = 'streak_freeze' THEN
    -- Limit streak freeze count to 3
    IF COALESCE(v_streak_freeze, 0) >= 3 THEN
      RETURN jsonb_build_object('success', false, 'reason', 'max_freeze_reached');
    END IF;

    UPDATE public.profiles
    SET gems = gems - v_item.price_gems,
        streak_freeze_count = COALESCE(streak_freeze_count, 0) + 1,
        updated_at = now()
    WHERE id = auth.uid();

    v_result := jsonb_build_object('success', true, 'streak_freeze_count', COALESCE(v_streak_freeze, 0) + 1, 'gems_spent', v_item.price_gems);

  ELSIF p_item_code = 'xp_booster' THEN
    DELETE FROM public.user_boosters WHERE user_id = auth.uid() AND booster_type = 'xp_booster';

    INSERT INTO public.user_boosters (user_id, booster_type, expires_at)
    VALUES (auth.uid(), 'xp_booster', now() + interval '15 minutes');

    UPDATE public.profiles
    SET gems = gems - v_item.price_gems,
        updated_at = now()
    WHERE id = auth.uid();

    v_result := jsonb_build_object('success', true, 'expires_at', now() + interval '15 minutes', 'gems_spent', v_item.price_gems);

  ELSE
    RAISE EXCEPTION 'Unknown item code';
  END IF;

  INSERT INTO public.user_purchases (user_id, shop_item_code, gems_spent)
  VALUES (auth.uid(), p_item_code, v_item.price_gems);

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_shop_item(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_shop_item(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(text) TO authenticated;

-- 3. refill_hearts
CREATE OR REPLACE FUNCTION public.refill_hearts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_price int := 50;
  v_gems int;
  v_hearts int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT price_gems INTO v_price
  FROM public.shop_items
  WHERE code = 'heart_refill';

  IF v_price IS NULL THEN
    v_price := 50;
  END IF;

  SELECT gems, hearts INTO v_gems, v_hearts
  FROM public.profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'profile_not_found');
  END IF;

  IF v_hearts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'hearts_already_full', 'hearts', v_hearts);
  END IF;

  IF v_gems < v_price THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_enough_gems', 'required_gems', v_price);
  END IF;

  UPDATE public.profiles
  SET gems = gems - v_price,
      hearts = 5,
      hearts_updated_at = now(),
      updated_at = now()
  WHERE id = auth.uid();

  INSERT INTO public.user_purchases (user_id, shop_item_code, gems_spent)
  VALUES (auth.uid(), 'heart_refill', v_price);

  RETURN jsonb_build_object('success', true, 'hearts', 5, 'gems_spent', v_price);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refill_hearts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refill_hearts() FROM anon;
GRANT EXECUTE ON FUNCTION public.refill_hearts() TO authenticated;

-- 4. check_achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_lessons_completed int;
  v_perfect_lessons int;
  v_stage1_lessons int;
  v_new_achievements jsonb := '[]'::jsonb;
  v_achievement public.achievements%ROWTYPE;
  v_already_earned boolean;
  v_study_hour int;
  v_total_xp_reward int := 0;
  v_total_gem_reward int := 0;
  v_ach jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF v_profile.id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT count(*) INTO v_lessons_completed
  FROM public.user_progress WHERE user_id = auth.uid() AND status = 'completed';

  SELECT count(*) INTO v_perfect_lessons
  FROM public.user_progress WHERE user_id = auth.uid() AND status = 'completed' AND score = 100;

  SELECT count(*) INTO v_stage1_lessons
  FROM public.user_progress up
  JOIN public.lessons l ON up.lesson_id = l.id
  WHERE up.user_id = auth.uid() AND up.status = 'completed';

  v_study_hour := extract(hour FROM (now() AT TIME ZONE COALESCE(v_profile.timezone, 'Africa/Cairo')))::int;

  FOR v_achievement IN SELECT * FROM public.achievements ORDER BY sort_order LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements
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
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (auth.uid(), v_achievement.id)
      ON CONFLICT DO NOTHING;

      v_total_xp_reward := v_total_xp_reward + v_achievement.xp_reward;
      v_total_gem_reward := v_total_gem_reward + v_achievement.gem_reward;

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

  -- Apply accumulated rewards in a single atomic update
  IF v_total_xp_reward > 0 OR v_total_gem_reward > 0 THEN
    UPDATE public.profiles
    SET total_xp = total_xp + v_total_xp_reward,
        gems = gems + v_total_gem_reward,
        updated_at = now()
    WHERE id = auth.uid();

    IF v_total_xp_reward > 0 THEN
      INSERT INTO public.user_xp_log (user_id, xp_amount, source)
      VALUES (auth.uid(), v_total_xp_reward, 'achievement');
    END IF;
  END IF;

  RETURN v_new_achievements;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_achievements() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_achievements() FROM anon;
GRANT EXECUTE ON FUNCTION public.check_achievements() TO authenticated;

-- 5. get_streak_calendar
CREATE OR REPLACE FUNCTION public.get_streak_calendar()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz text;
  v_today date;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT timezone INTO v_tz FROM public.profiles WHERE id = auth.uid();
  v_tz := COALESCE(v_tz, 'Africa/Cairo');
  v_today := (now() AT TIME ZONE v_tz)::date;

  SELECT jsonb_agg(
    jsonb_build_object(
      'date', d::date,
      'studied', EXISTS(
        SELECT 1 FROM public.streaks
        WHERE user_id = auth.uid() AND study_date = d::date AND (xp_earned > 0 OR used_freeze = false)
      ),
      'used_freeze', EXISTS(
        SELECT 1 FROM public.streaks
        WHERE user_id = auth.uid() AND study_date = d::date AND used_freeze = true
      ),
      'is_today', d::date = v_today
    ) ORDER BY d::date
  ) INTO v_result
  FROM generate_series(v_today - 6, v_today, interval '1 day') AS d;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_streak_calendar() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_streak_calendar() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_streak_calendar() TO authenticated;

-- 6. compute_weekly_leagues & get_weekly_leaderboard
CREATE OR REPLACE FUNCTION public.compute_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_week_start date := date_trunc('week', CURRENT_DATE)::date;
BEGIN
  DELETE FROM public.leaderboard_weekly WHERE week_start_date = v_week_start;

  -- Compute ranks based on actual weekly XP from user_xp_log
  WITH weekly_user_xp AS (
    SELECT
      p.id AS user_id,
      COALESCE(sum(x.xp_amount), 0)::int AS week_xp
    FROM public.profiles p
    LEFT JOIN public.user_xp_log x
      ON p.id = x.user_id
      AND x.created_at >= v_week_start
      AND x.created_at < (v_week_start + interval '7 days')
    GROUP BY p.id
  ),
  ranked_users AS (
    SELECT
      w.user_id,
      v_week_start AS week_start_date,
      w.week_xp AS total_xp,
      CASE
        WHEN w.week_xp < 50 THEN 'bronze'
        WHEN w.week_xp < 200 THEN 'silver'
        WHEN w.week_xp < 500 THEN 'gold'
        WHEN w.week_xp < 1000 THEN 'sapphire'
        WHEN w.week_xp < 2000 THEN 'ruby'
        ELSE 'diamond'
      END AS league,
      ROW_NUMBER() OVER (
        PARTITION BY
          CASE
            WHEN w.week_xp < 50 THEN 'bronze'
            WHEN w.week_xp < 200 THEN 'silver'
            WHEN w.week_xp < 500 THEN 'gold'
            WHEN w.week_xp < 1000 THEN 'sapphire'
            WHEN w.week_xp < 2000 THEN 'ruby'
            ELSE 'diamond'
          END
        ORDER BY w.week_xp DESC
      )::int AS rank
    FROM weekly_user_xp w
  )
  INSERT INTO public.leaderboard_weekly (user_id, week_start_date, total_xp, league, rank)
  SELECT user_id, week_start_date, total_xp, league, rank
  FROM ranked_users;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compute_weekly_leagues FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_weekly_leagues FROM anon;
GRANT EXECUTE ON FUNCTION public.compute_weekly_leagues TO authenticated;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_week_start date := date_trunc('week', CURRENT_DATE)::date;
  v_user_league text;
  v_count int;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('league', 'bronze', 'entries', '[]'::jsonb);
  END IF;

  -- If leaderboard empty for this week, auto compute on the fly
  SELECT count(*) INTO v_count
  FROM public.leaderboard_weekly
  WHERE week_start_date = v_week_start;

  IF v_count = 0 THEN
    PERFORM public.compute_weekly_leagues();
  END IF;

  SELECT league INTO v_user_league
  FROM public.leaderboard_weekly
  WHERE user_id = auth.uid() AND week_start_date = v_week_start;

  v_user_league := COALESCE(v_user_league, 'bronze');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', lw.user_id,
    'total_xp', lw.total_xp,
    'rank', lw.rank,
    'league', lw.league,
    'display_name', COALESCE(p.display_name, 'طالب جديد'),
    'avatar_url', p.avatar_url,
    'is_me', lw.user_id = auth.uid()
  ) ORDER BY lw.rank), '[]'::jsonb) INTO v_result
  FROM public.leaderboard_weekly lw
  JOIN public.profiles p ON lw.user_id = p.id
  WHERE lw.league = v_user_league AND lw.week_start_date = v_week_start;

  RETURN jsonb_build_object('league', v_user_league, 'entries', v_result);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_weekly_leaderboard FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_weekly_leaderboard FROM anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard TO authenticated;
