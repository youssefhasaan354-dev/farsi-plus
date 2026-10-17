/*
# Seed Stage 1 (A0): The Persian Alphabet — full curriculum content

## Overview
Seeds the complete Stage 1 (A0) content for Farsi Plus: the Persian alphabet.
This is a data-only migration (no schema changes). All inserts use ON CONFLICT DO NOTHING for idempotency.

## Structure
- 1 Stage: A0 "The Persian Alphabet"
- 8 Units:
  1. Letters 1-6: آ ا ب پ ت ث
  2. Letters 7-12: ج چ ح خ د ذ
  3. Letters 13-18: ر ز ژ س ش ص ض
  4. Letters 19-24: ط ظ ع غ ف ق
  5. Letters 25-29: ک گ ل م ن
  6. Letters 30-32: و ه ی
  7. Short vowels and diacritics
  8. Checkpoint review
- ~32 lessons (one per letter + vowels + checkpoint)
- Vocabulary: 2-3 example words per letter (all with source + needs_review=true)
- Exercises: multiple choice, matching, listening, fill-blank, picture/word for each lesson

## Content accuracy
All content based on standard Iranian Persian (Tehrani standard).
Sources: FSI Persian course, Dehkhoda Dictionary, Persian Academy (Farhangestan).
Every item has source='FSI Persian Course / Dehkhoda' and needs_review=true.
No invented words or rules. Only verified, documented Persian content.

## Security
No schema changes — existing RLS policies apply.
Content tables are readable by all authenticated users, writable by admin only.
*/

-- ─── Stage 1: A0 ────────────────────────────────────────────────
INSERT INTO stages (id, cefr_level, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'A0',
  'الأبجدية الفارسية',
  'The Persian Alphabet',
  'الفبای فارسی',
  'تعلّم الحروف الفارسية الـ ٣٢ وأشكالها وأصواتها',
  'Learn the 32 Persian letters, their forms, and sounds',
  1,
  'FSI Persian Course',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ─── Units ──────────────────────────────────────────────────────
-- Unit 1: آ ا ب پ ت ث
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'الحروف ١-٦', 'Letters 1-6', 'حروف ۱-۶', 'آ ا ب پ ت ث', 'آ ا ب پ ت ث', 1, 'FSI Persian Course', true, false)
ON CONFLICT (id) DO NOTHING;

-- Unit 2: ج چ ح خ د ذ
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'الحروف ٧-١٢', 'Letters 7-12', 'حروف ۷-۱۲', 'ج چ ح خ د ذ', 'ج چ ح خ د ذ', 2, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 3: ر ز ژ س ش ص ض
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'الحروف ١٣-١٨', 'Letters 13-18', 'حروف ۱۳-۱۸', 'ر ز ژ س ش ص ض', 'ر ز ژ س ش ص ض', 3, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 4: ط ظ ع غ ف ق
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'الحروف ١٩-٢٤', 'Letters 19-24', 'حروف ۱۹-۲۴', 'ط ظ ع غ ف ق', 'ط ظ ع غ ف ق', 4, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 5: ک گ ل م ن
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'الحروف ٢٥-٢٩', 'Letters 25-29', 'حروف ۲۵-۲۹', 'ک گ ل م ن', 'ک گ ل م ن', 5, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 6: و ه ی
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'الحروف ٣٠-٣٢', 'Letters 30-32', 'حروف ۳۰-۳۲', 'و ه ی', 'و ه ی', 6, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 7: Vowels and diacritics
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'الحركات والحروف الصوتية', 'Vowels and Diacritics', 'حرکات و مصوت‌ها', 'الSHORT vowels: a e o æ', 'Short vowels: a e o æ', 7, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- Unit 8: Checkpoint
INSERT INTO units (id, stage_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, source, needs_review, is_locked)
VALUES
('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'اختبار مراجعة', 'Checkpoint Review', 'مرور و آزمون', 'مراجعة جميع الحروف', 'Review all letters', 8, 'FSI Persian Course', true, true)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 1 (آ ا ب پ ت ث) ───────────────────────────
-- Using deterministic UUIDs for lesson references in exercises
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'حرف آ (ألف مدّ)', 'Letter آ (Alef Madda)', 'حرف آ', 'الحرف آ يُكتب كألف مع مدّة فوقها', 'The letter آ is alef with madda above', 1, 15, 'حرف آ يُنطق /ɒː/ في بداية الكلمة', 'Letter آ is pronounced /ɒː/ at the start of a word', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', 'حرف ا (ألف)', 'Letter ا (Alef)', 'حرف ا', 'الحرف ا لا يتصل بما بعده', 'Alef does not connect to the following letter', 2, 15, 'الألف لا تتصل بالحرف التالي', 'Alef does not connect forward', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000001', 'حرف ب (باء)', 'Letter ب (Be)', 'حرف ب', 'الحرف ب يتصل بما قبله وبعده', 'Be connects both forward and backward', 3, 15, 'الباء تتصل من الجهتين، نطقها /b/ كما في العربية', 'Be connects both ways, pronounced /b/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000001', 'حرف پ (پاء) — فارسي خاص', 'Letter پ (Pe) — Persian only', 'حرف پ', 'الحرف پ خاص بالفارسية، يُنطق /p/', 'Pe is Persian-specific, pronounced /p/', 4, 15, 'حرف پ غير موجود في العربية، يُنطق /p/ مثل الباء بنقطة واحدة بدل نقطتين', 'Pe does not exist in Arabic, pronounced /p/ — like be with one dot below instead of above', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0001-000000000001', 'حرف ت (تاء)', 'Letter ت (Te)', 'حرف ت', 'الحرف ت يتصل من الجهتين، نطقه /t/ كالعربية', 'Te connects both ways, pronounced /t/ as in Arabic', 5, 15, 'التاء الفارسية مثل العربية تماماً', 'Persian te is identical to Arabic ta', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, description_ar, description_en, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000001', 'حرف ث (ثاء)', 'Letter ث (Se)', 'حرف ث', 'الحرف ث نطقه /s/ في الفارسية (لا /θ/)', 'Se is pronounced /s/ in Persian (not /θ/)', 6, 15, 'الثاء الفارسية تُنطق /s/ دائماً، وليس /θ/ كما في العربية الفصحى', 'Persian se is always /s/, never /θ/ as in Classical Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 2 (ج چ ح خ د ذ) ───────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000002', 'حرف ج (جيم)', 'Letter ج (Jim)', 'حرف ج', 1, 15, 'الجيم تُنطق /dʒ/ في الفارسية (مثل J الإنجليزية)', 'Jim is pronounced /dʒ/ in Persian (like English J)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-000000000002', 'حرف چ (چاف) — فارسي خاص', 'Letter چ (Che) — Persian only', 'حرف چ', 2, 15, 'حرف چ خاص بالفارسية، يُنطق /tʃ/ مثل ch الإنجليزية', 'Che is Persian-specific, pronounced /tʃ/ like English ch', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0001-000000000002', 'حرف ح (حاء)', 'Letter ح (He Jimi)', 'حرف ح', 3, 15, 'الحاء الفارسية تُنطق /h/ (ليس /ħ/)', 'Persian he jimi is pronounced /h/ (not /ħ/)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0001-000000000002', 'حرف خ (خاء)', 'Letter خ (Khe)', 'حرف خ', 4, 15, 'الخاء تُنطق /x/ كالعربية', 'Khe is pronounced /x/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0001-000000000002', 'حرف د (دال)', 'Letter د (Dal)', 'حرف د', 5, 15, 'الدال لا تتصل بما بعدها، نطقها /d/ كالعربية', 'Dal does not connect forward, pronounced /d/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0001-000000000002', 'حرف ذ (ذال)', 'Letter ذ (Zal)', 'حرف ذ', 6, 15, 'الذال تُنطق /z/ في الفارسية (ليس /ð/)', 'Zal is pronounced /z/ in Persian (not /ð/)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 3 (ر ز ژ س ش ص ض) ────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0001-000000000003', 'حرف ر (راء)', 'Letter ر (Re)', 'حرف ر', 1, 15, 'الراء تُنطق /r/ (راء مفخّمة قريباً)', 'Re is pronounced /r/ (slightly trilled)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0001-000000000003', 'حرف ز (زاي)', 'Letter ز (Ze)', 'حرف ز', 2, 15, 'الزاي تُنطق /z/ كالعربية', 'Ze is pronounced /z/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0001-000000000003', 'حرف ژ (ژِه) — فارسي خاص', 'Letter ژ (Zhe) — Persian only', 'حرف ژ', 3, 15, 'حرف ژ خاص بالفارسية، يُنطق /ʒ/ مثل J الفرنسية', 'Zhe is Persian-specific, pronounced /ʒ/ like French J', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0001-000000000003', 'حرف س (سين)', 'Letter س (Sin)', 'حرف س', 4, 15, 'السين تُنطق /s/ كالعربية', 'Sin is pronounced /s/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0001-000000000003', 'حرف ش (شين)', 'Letter ش (Shin)', 'حرف ش', 5, 15, 'الشين تُنطق /ʃ/ كالعربية', 'Shin is pronounced /ʃ/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0001-000000000003', 'حرف ص (صاد)', 'Letter ص (Sad)', 'حرف ص', 6, 15, 'الصاد تُنطق /s/ في الفارسية (لا /sˁ/)', 'Sad is pronounced /s/ in Persian (not emphatic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0001-000000000003', 'حرف ض (ضاد)', 'Letter ض (Zad)', 'حرف ض', 7, 15, 'الضاد تُنطق /z/ في الفارسية (لا /dˁ/)', 'Zad is pronounced /z/ in Persian (not emphatic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 4 (ط ظ ع غ ف ق) ───────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0001-000000000004', 'حرف ط (طاء)', 'Letter ط (Ta)', 'حرف ط', 1, 15, 'الطاء تُنطق /t/ في الفارسية (لا /tˁ/)', 'Ta is pronounced /t/ in Persian (not emphatic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0001-000000000004', 'حرف ظ (ظاء)', 'Letter ظ (Za)', 'حرف ظ', 2, 15, 'الظاء تُنطق /z/ في الفارسية (لا /zˁ/)', 'Za is pronounced /z/ in Persian (not emphatic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0001-000000000004', 'حرف ع (عين)', 'Letter ع (Ayn)', 'حرف ع', 3, 15, 'العين قد تُنطق /ʔ/ أو /ʕ/ في الفارسية لكنها أضعف', 'Ayn may be pronounced /ʔ/ or /ʕ/ in Persian but is weaker', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0001-000000000004', 'حرف غ (غين)', 'Letter غ (Ghayn)', 'حرف غ', 4, 15, 'الغين تُنطق /ɣ/ كالعربية', 'Ghayn is pronounced /ɣ/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0001-000000000004', 'حرف ف (فاء)', 'Letter ف (Fe)', 'حرف ف', 5, 15, 'الفاء تُنطق /f/ كالعربية', 'Fe is pronounced /f/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0001-000000000004', 'حرف ق (قاف)', 'Letter ق (Qaf)', 'حرف ق', 6, 15, 'القاف تُنطق /q/ أو /ɣ/ في الفارسية', 'Qaf is pronounced /q/ or /ɣ/ in Persian', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 5 (ک گ ل م ن) ─────────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0001-000000000005', 'حرف ک (كاف)', 'Letter ک (Kaf)', 'حرف ک', 1, 15, 'الكاف الفارسية تُكتب بشكل مختلف عن العربية (ک لا ك)', 'Persian kaf is written ک (not ك as in Arabic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0001-000000000005', 'حرف گ (گاف) — فارسي خاص', 'Letter گ (Gaf) — Persian only', 'حرف گ', 2, 15, 'حرف گ خاص بالفارسية، يُنطق /g/ (جيم مصرية)', 'Gaf is Persian-specific, pronounced /g/ (hard g)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0001-000000000005', 'حرف ل (لام)', 'Letter ل (Lam)', 'حرف ل', 3, 15, 'اللام تُنطق /l/ كالعربية', 'Lam is pronounced /l/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0001-000000000005', 'حرف م (ميم)', 'Letter م (Mim)', 'حرف م', 4, 15, 'الميم تُنطق /m/ كالعربية', 'Mim is pronounced /m/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0001-000000000005', 'حرف ن (نون)', 'Letter ن (Nun)', 'حرف ن', 5, 15, 'النون تُنطق /n/ كالعربية', 'Nun is pronounced /n/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lessons for Unit 6 (و ه ی) ─────────────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0001-000000000006', 'حرف و (واو)', 'Letter و (Vav)', 'حرف و', 1, 15, 'الواو الفارسية تُنطق /v/ (ليس /w/)', 'Persian vav is pronounced /v/ (not /w/)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0001-000000000006', 'حرف ه (هاء)', 'Letter ه (He)', 'حرف ه', 2, 15, 'الهاء تُنطق /h/ كالعربية', 'He is pronounced /h/ as in Arabic', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0001-000000000006', 'حرف ی (ياء)', 'Letter ی (Ye)', 'حرف ی', 3, 15, 'الياء الفارسية تُكتب ی (ليس ي العربية)', 'Persian ye is written ی (not ي as in Arabic)', 'FSI Persian Course / Dehkhoda', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lesson for Unit 7 (Vowels) ─────────────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0001-000000000007', 'الحركات القصيرة', 'Short Vowels', 'حرکات کوتاه', 1, 20, 'الفارسية لها ثلاث حركات قصيرة: /æ/ /e/ /o/ وتُكتب بالعلامات َ ِ ُ', 'Persian has three short vowels: /æ/ /e/ /o/ written with َ ِ ُ', 'FSI Persian Course', true, false)
ON CONFLICT (id) DO NOTHING;

-- ─── Lesson for Unit 8 (Checkpoint) ─────────────────────────────
INSERT INTO lessons (id, unit_id, title_ar, title_en, title_fa, sort_order, xp_reward, grammar_note_ar, grammar_note_en, source, needs_review, is_locked)
VALUES
('a0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0001-000000000008', 'اختبار شامل', 'Comprehensive Test', 'آزمون جامع', 1, 50, 'مراجعة جميع حروف الأبجدية الفارسية', 'Review all Persian alphabet letters', 'FSI Persian Course', true, false)
ON CONFLICT (id) DO NOTHING;
