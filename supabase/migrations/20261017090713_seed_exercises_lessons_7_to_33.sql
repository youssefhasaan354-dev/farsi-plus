/*
# Seed exercises for letter lessons 7-33

## Problem
27 letter lessons (ج through ی, lessons 7-33) had zero exercises. Lessons 1-6
already had 8 exercises each following a consistent template:
1. multiple_choice — "أي حرف هذا؟" with the letter as the correct answer
2. listening — "استمع واختر الحرف الصحيح" with the letter to speak
3. fill_blank — "أكمل الكلمة: __" with a word starting with the letter
4. word_matching — match Persian words to Arabic meanings
5. picture_word — "أي حرف يبدأ بهذه الكلمة؟"
6. letter_tracing — "ارسم حرف X"
7. typing_persian — "اكتب: [word]"
8. pronunciation — "انطق: [word]"

## Changes
For each of the 27 lessons, insert 8 exercises using a PL/pgSQL loop that:
- Extracts the Persian letter from the lesson title
- Uses a word starting with that letter for the word-based exercises
- Generates distractor options from other Persian letters
- Sets source='seed' and needs_review=false

## Notes
- All exercises use the same structure as existing lessons 1-6
- Distractors are selected from nearby letters in the alphabet
*/

DO $$
DECLARE
  lesson_record RECORD;
  letter TEXT;
  word TEXT;
  meaning TEXT;
  distractors TEXT[];
  all_letters TEXT[] := ARRAY['آ','ا','ب','پ','ت','ث','ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی'];
  letter_idx INT;
  d1 TEXT; d2 TEXT; d3 TEXT;
BEGIN
  FOR lesson_record IN
    SELECT l.id, l.title_ar, l.title_en, l.sort_order, u.sort_order AS unit_order
    FROM lessons l
    JOIN units u ON l.unit_id = u.id
    WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.lesson_id = l.id)
    ORDER BY u.sort_order, l.sort_order
  LOOP
    -- Extract the Persian letter from title_ar (first letter inside parentheses after "حرف ")
    -- The title format is "حرف X (name)" so the 6th character is the letter
    letter := substring(lesson_record.title_ar from 6 for 1);

    -- Skip if we couldn't extract a letter
    IF letter IS NULL OR letter = '' THEN
      CONTINUE;
    END IF;

    -- Find letter index in all_letters for picking distractors
    letter_idx := array_position(all_letters, letter);
    IF letter_idx IS NULL THEN
      letter_idx := 1;
    END IF;

    -- Pick 3 distractors from the letters array (wrapping around)
    d1 := all_letters[((letter_idx + 3 - 1) % array_length(all_letters, 1)) + 1];
    d2 := all_letters[((letter_idx + 7 - 1) % array_length(all_letters, 1)) + 1];
    d3 := all_letters[((letter_idx + 11 - 1) % array_length(all_letters, 1)) + 1];

    -- Pick a word starting with this letter (use a simple per-letter mapping)
    -- We'll use the letter itself + a common Persian vowel ending as the word
    word := CASE letter
      WHEN 'ج' THEN 'جل'
      WHEN 'چ' THEN 'چشم'
      WHEN 'ح' THEN 'حسن'
      WHEN 'خ' THEN 'خر'
      WHEN 'د' THEN 'دست'
      WHEN 'ذ' THEN 'ذره'
      WHEN 'ر' THEN 'رد'
      WHEN 'ز' THEN 'زر'
      WHEN 'ژ' THEN 'ژاله'
      WHEN 'س' THEN 'سیب'
      WHEN 'ش' THEN 'شیر'
      WHEN 'ص' THEN 'صبر'
      WHEN 'ض' THEN 'ضرب'
      WHEN 'ط' THEN 'طب'
      WHEN 'ظ' THEN 'ظلم'
      WHEN 'ع' THEN 'علم'
      WHEN 'غ' THEN 'غرب'
      WHEN 'ف' THEN 'فرد'
      WHEN 'ق' THEN 'قفل'
      WHEN 'ک' THEN 'کتاب'
      WHEN 'گ' THEN 'گل'
      WHEN 'ل' THEN 'لوح'
      WHEN 'م' THEN 'مرد'
      WHEN 'ن' THEN 'نور'
      WHEN 'و' THEN 'ورد'
      WHEN 'ه' THEN 'هوا'
      WHEN 'ی' THEN 'یاد'
      ELSE letter || 'ا'
    END;

    meaning := CASE letter
      WHEN 'ج' THEN 'جل (جلد)'
      WHEN 'چ' THEN 'عين'
      WHEN 'ح' THEN 'حسن (اسم)'
      WHEN 'خ' THEN 'حمار'
      WHEN 'د' THEN 'يد'
      WHEN 'ذ' THEN 'ذرة'
      WHEN 'ر' THEN 'أثر'
      WHEN 'ز' THEN 'ذهب'
      WHEN 'ژ' THEN 'ژاله (اسم)'
      WHEN 'س' THEN 'تفاحة'
      WHEN 'ش' THEN 'أسد'
      WHEN 'ص' THEN 'صبر'
      WHEN 'ض' THEN 'ضرب'
      WHEN 'ط' THEN 'طب'
      WHEN 'ظ' THEN 'ظلم'
      WHEN 'ع' THEN 'علم'
      WHEN 'غ' THEN 'غرب'
      WHEN 'ف' THEN 'فرد'
      WHEN 'ق' THEN 'قفل'
      WHEN 'ک' THEN 'كتاب'
      WHEN 'گ' THEN 'وردة'
      WHEN 'ل' THEN 'لوح'
      WHEN 'م' THEN 'رجل'
      WHEN 'ن' THEN 'نور'
      WHEN 'و' THEN 'ورد'
      WHEN 'ه' THEN 'هواء'
      WHEN 'ی' THEN 'ذكرى'
      ELSE letter
    END;

    -- 1. multiple_choice
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'multiple_choice',
      'أي حرف هذا؟', 'Which letter is this?',
      jsonb_build_object('correct', letter, 'display', letter, 'options', jsonb_build_array(letter, d1, d2, d3)),
      to_jsonb(letter), 1, 'seed', false
    );

    -- 2. listening
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'listening',
      'استمع واختر الحرف الصحيح', 'Listen and choose the correct letter',
      jsonb_build_object('correct', letter, 'options', jsonb_build_array(letter, d1, d2, d3), 'question', 'استمع واختر الحرف الصحيح', 'text_to_speak', letter),
      to_jsonb(letter), 2, 'seed', false
    );

    -- 3. fill_blank
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'fill_blank',
      'أكمل الكلمة', 'Complete the word',
      jsonb_build_object('word', word, 'correct', letter, 'display', '_' || substring(word from 2), 'options', jsonb_build_array(letter, d1, d2, d3), 'blank_position', 'start'),
      to_jsonb(letter), 3, 'seed', false
    );

    -- 4. word_matching
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'word_matching',
      'طابق الكلمات بمعناها', 'Match words to their meanings',
      jsonb_build_object('pairs', jsonb_build_array(
        jsonb_build_object('left', word, 'right', meaning),
        jsonb_build_object('left', letter || 'ا', 'right', 'حرف'),
        jsonb_build_object('left', substring(word from 1 for 1) || 'ل', 'right', 'كلمة'),
        jsonb_build_object('left', letter, 'right', 'حرف ' || letter)
      )),
      NULL, 4, 'seed', false
    );

    -- 5. picture_word
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'picture_word',
      'أي حرف يبدأ بهذه الكلمة؟', 'Which letter does this word start with?',
      jsonb_build_object('word', word, 'correct', letter, 'options', jsonb_build_array(letter, d1, d2, d3)),
      to_jsonb(letter), 5, 'seed', false
    );

    -- 6. letter_tracing
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'letter_tracing',
      'ارسم حرف ' || letter, 'Trace letter ' || letter,
      jsonb_build_object('letter', letter, 'passing_score', 50),
      NULL, 100, 'seed', false
    );

    -- 7. typing_persian
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'typing_persian',
      'اكتب: ' || meaning, 'Type: ' || meaning,
      jsonb_build_object('prompt', meaning, 'correct', word, 'placeholder', word),
      NULL, 101, 'seed', false
    );

    -- 8. pronunciation
    INSERT INTO exercises (id, lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review)
    VALUES (
      gen_random_uuid(), lesson_record.id, 'pronunciation',
      'انطق: ' || word, 'Pronounce: ' || word,
      jsonb_build_object('passing_score', 50, 'text_to_speak', word),
      NULL, 102, 'seed', false
    );
  END LOOP;
END $$;
