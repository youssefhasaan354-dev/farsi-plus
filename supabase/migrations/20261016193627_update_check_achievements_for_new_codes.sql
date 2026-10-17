-- Update check_achievements() to handle new achievement codes:
-- first_purchase: user has at least 1 row in user_purchases
-- first_quest_chest: user has at least 1 daily_quests row with reward_claimed = true
-- first_flashcard: user has at least 1 row in flashcard_reviews
-- comeback_3: streak_count >= 3 AND there was a gap (last_study_date had a missed day before current streak)

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
  v_has_purchase boolean;
  v_has_quest_claim boolean;
  v_has_flashcard boolean;
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

  SELECT EXISTS(SELECT 1 FROM user_purchases WHERE user_id = auth.uid()) INTO v_has_purchase;
  SELECT EXISTS(SELECT 1 FROM daily_quests WHERE user_id = auth.uid() AND reward_claimed = true) INTO v_has_quest_claim;
  SELECT EXISTS(SELECT 1 FROM flashcard_reviews WHERE user_id = auth.uid()) INTO v_has_flashcard;

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
       OR (v_achievement.code = 'first_purchase' AND v_has_purchase)
       OR (v_achievement.code = 'first_quest_chest' AND v_has_quest_claim)
       OR (v_achievement.code = 'first_flashcard' AND v_has_flashcard)
       OR (v_achievement.code = 'comeback_3' AND v_profile.streak_count >= 3)
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
