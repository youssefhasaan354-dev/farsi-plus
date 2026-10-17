/*
# Seed Stage 1: Exercises — interactive exercises for letter lessons

## Overview
Seeds exercises for the first 6 letter lessons (Unit 1: آ ا ب پ ت ث) with all 5 exercise types.
Additional lessons will generate exercises dynamically from vocabulary data in the frontend.

## Exercise types per lesson:
1. multiple_choice — "Which letter is this?" (4 options)
2. word_matching — Match Persian words to Arabic meanings (4 pairs)
3. listening — "Listen and choose the correct letter" (uses Web Speech API)
4. fill_blank — "Fill in the missing letter" (word with blank)
5. picture_word — "Choose the letter that starts this word" (word shown, pick initial letter)

## Data format (jsonb `data` column):
- multiple_choice: { question: "أي حرف هذا؟", display: "ب", options: ["ب","ت","ث","پ"], correct: "ب" }
- word_matching: { pairs: [{left:"باب",right:"باب"},{left:"برف",right:"ثلج"},...] }
- listening: { text_to_speak: "آب", question: "استمع واختر الكلمة الصحيحة", options: ["آب","ابر","باب","تاب"], correct: "آب" }
- fill_blank: { question: "أكمل الكلمة: __اب", display: "_اب", options: ["ب","ت","ث","پ"], correct: "ب" }
- picture_word: { question: "أي حرف يبدأ بهذه الكلمة؟", word: "آب", options: ["آ","ا","ب","ت"], correct: "آ" }

## All exercises have source='FSI Persian Course' and needs_review=true.
*/

-- Lesson 1: آ (Alef Madda)
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000001', 'multiple_choice', 'أي حرف هذا؟', 'Which letter is this?', '{"display":"آ","options":["آ","ا","ء","ع"],"correct":"آ"}', '"آ"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', 'listening', 'استمع واختر الحرف الصحيح', 'Listen and choose the correct letter', '{"text_to_speak":"آ","question":"استمع واختر الحرف الصحيح","options":["آ","ا","ع","ء"],"correct":"آ"}', '"آ"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', 'fill_blank', 'أكمل الكلمة: __ب', 'Fill in the blank: __b', '{"display":"_ب","word":"آب","options":["آ","ا","ع","ء"],"correct":"آ","blank_position":"start"}', '"آ"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', 'word_matching', 'اطابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"آب","right":"ماء"},{"left":"آهو","right":"غزال"},{"left":"آس","right":"آس (نبتة)"},{"left":"آباد","right":"معمور"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"آب","options":["آ","ا","ب","ت"],"correct":"آ"}', '"آ"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Lesson 2: ا (Alef)
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000002', 'multiple_choice', 'أي حرف هذا؟', 'Which letter is this?', '{"display":"ا","options":["ا","آ","ء","ع"],"correct":"ا"}', '"ا"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', 'listening', 'استمع واختر الكلمة الصحيحة', 'Listen and choose the correct word', '{"text_to_speak":"ابر","question":"استمع واختر الكلمة الصحيحة","options":["ابر","آب","آس","آهو"],"correct":"ابر"}', '"ابر"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', 'fill_blank', 'أكمل الكلمة: __ران', 'Fill in the blank: __ran', '{"display":"_ران","word":"ايران","options":["ا","آ","ع","ء"],"correct":"ا","blank_position":"start"}', '"ا"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', 'word_matching', 'طابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"ابر","right":"غيمة"},{"left":"اسم","right":"اسم"},{"left":"ايران","right":"إيران"},{"left":"ايد","right":"يد"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"اسم","options":["ا","آ","س","ع"],"correct":"ا"}', '"ا"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Lesson 3: ب (Be)
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000003', 'multiple_choice', 'أي حرف هذا؟', 'Which letter is this?', '{"display":"ب","options":["ب","ت","ث","پ"],"correct":"ب"}', '"ب"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', 'listening', 'استمع واختر الكلمة الصحيحة', 'Listen and choose the correct word', '{"text_to_speak":"باب","question":"استمع واختر الكلمة الصحيحة","options":["باب","تاب","ناب","خاب"],"correct":"باب"}', '"باب"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', 'fill_blank', 'أكمل الكلمة: __اب', 'Fill in the blank: b__b (door)', '{"display":"ب_ب","word":"باب","options":["ب","ت","ث","پ"],"correct":"ا","blank_position":"middle"}', '"ا"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', 'word_matching', 'طابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"باب","right":"باب"},{"left":"برف","right":"ثلج"},{"left":"باد","right":"ريح"},{"left":"باران","right":"مطر"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"برف","options":["ب","ت","ث","پ"],"correct":"ب"}', '"ب"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Lesson 4: پ (Pe) — Persian only
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000004', 'multiple_choice', 'أي حرف هذا؟ (خاص بالفارسية)', 'Which letter is this? (Persian only)', '{"display":"پ","options":["پ","ب","ت","ث"],"correct":"پ"}', '"پ"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000004', 'listening', 'استمع واختر الكلمة الصحيحة', 'Listen and choose the correct word', '{"text_to_speak":"پدر","question":"استمع واختر الكلمة الصحيحة","options":["پدر","بدر","تدر","ثدر"],"correct":"پدر"}', '"پدر"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000004', 'fill_blank', 'أكمل الكلمة: __در', 'Fill in the blank: __dar (father)', '{"display":"_در","word":"پدر","options":["پ","ب","ت","ث"],"correct":"پ","blank_position":"start"}', '"پ"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000004', 'word_matching', 'طابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"پدر","right":"أب"},{"left":"پاک","right":"طاهر"},{"left":"پنجر","right":"مخلب"},{"left":"پتو","right":"بطانية"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000004', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"پاک","options":["پ","ب","ت","ث"],"correct":"پ"}', '"پ"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Lesson 5: ت (Te)
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000005', 'multiple_choice', 'أي حرف هذا؟', 'Which letter is this?', '{"display":"ت","options":["ت","ب","ث","پ"],"correct":"ت"}', '"ت"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', 'listening', 'استمع واختر الكلمة الصحيحة', 'Listen and choose the correct word', '{"text_to_speak":"تهران","question":"استمع واختر الكلمة الصحيحة","options":["تهران","تاران","توران","دران"],"correct":"تهران"}', '"تهران"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', 'fill_blank', 'أكمل الكلمة: __نگ', 'Fill in the blank: t__ng (narrow)', '{"display":"_نگ","word":"تنگ","options":["ت","ب","ث","پ"],"correct":"ت","blank_position":"start"}', '"ت"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', 'word_matching', 'طابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"تهران","right":"طهران"},{"left":"تنگ","right":"ضيق"},{"left":"ترازو","right":"ميزان"},{"left":"تار","right":"وتر"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"تنگ","options":["ت","ب","ث","پ"],"correct":"ت"}', '"ت"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Lesson 6: ث (Se)
INSERT INTO exercises (lesson_id, type, question_ar, question_en, data, correct_answer, sort_order, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000006', 'multiple_choice', 'أي حرف هذا؟', 'Which letter is this?', '{"display":"ث","options":["ث","ت","ب","پ"],"correct":"ث"}', '"ث"', 1, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', 'listening', 'استمع واختر الكلمة الصحيحة', 'Listen and choose the correct word', '{"text_to_speak":"ثمر","question":"استمع واختر الكلمة الصحيحة","options":["ثمر","سمر","تار","ثار"],"correct":"ثمر"}', '"ثمر"', 2, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', 'fill_blank', 'أكمل الكلمة: __ابت', 'Fill in the blank: s__bet (stable)', '{"display":"_ابت","word":"ثابت","options":["ث","ت","ب","س"],"correct":"ث","blank_position":"start"}', '"ث"', 3, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', 'word_matching', 'طابق الكلمات بمعناها', 'Match words to their meanings', '{"pairs":[{"left":"ثمر","right":"ثمر"},{"left":"ثابت","right":"ثابت"},{"left":"ثاني","right":"ثاني"},{"left":"ثواب","right":"ثواب"}]}', null, 4, 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', 'picture_word', 'أي حرف يبدأ بهذه الكلمة؟', 'Which letter starts this word?', '{"word":"ثمر","options":["ث","ت","ب","س"],"correct":"ث"}', '"ث"', 5, 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;
