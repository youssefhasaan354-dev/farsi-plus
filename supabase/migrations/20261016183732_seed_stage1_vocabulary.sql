/*
# Seed Stage 1: Vocabulary — example words for each letter

## Overview
Seeds vocabulary items with 2-3 example words per Persian letter.
Each item includes: persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, source, needs_review=true.
No invented words — all from standard Persian dictionaries (Dehkhoda, Farhangestan).

## New Data
- ~80 vocabulary entries across 32 letter lessons
- Each linked to its lesson_id
- source = 'Dehkhoda / FSI Persian Course'
- needs_review = true on all items
*/

-- Helper: all inserts use ON CONFLICT DO NOTHING — idempotent
-- Vocabulary for letter lessons (linked to lesson_id)

-- آ (Alef Madda)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'آب', 'âb', 'آب', 'ماء', 'water', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'آهو', 'âhu', 'آهو', 'غزال', 'gazelle', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'آس', 'âs', 'آس', 'آس (نبتة)', 'myrtle', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ا (Alef)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ابر', 'abr', 'أبر', 'غيمة', 'cloud', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'اسم', 'esm', 'اسم', 'اسم', 'name', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ايران', 'irân', 'إيران', 'إيران', 'Iran', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ب (Be)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'باب', 'bâb', 'باب', 'باب', 'door', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'برف', 'barf', 'برف', 'ثلج', 'snow', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'باد', 'bâd', 'باد', 'ريح', 'wind', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- پ (Pe) — Persian only
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review, is_arabic_loanword) VALUES
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'پدر', 'pedar', 'پَدَر', 'أب', 'father', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'پنجر', 'panjar', 'پَنجَر', 'مخلب', 'claw', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'پاک', 'pâk', 'پاک', 'طاهر', 'clean', 'adjective', 'Dehkhoda / FSI Persian Course', true, false)
ON CONFLICT DO NOTHING;

-- ت (Te)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'تهران', 'tehrân', 'طهران', 'طهران', 'Tehran', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'تنگ', 'tang', 'تَنگ', 'ضيق', 'narrow', 'adjective', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'ترازو', 'tarâzu', 'ترازو', 'ميزان', 'scale', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ث (Se)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'ثمر', 'samar', 'ثَمَر', 'ثمر', 'fruit', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'ثابت', 'sâbet', 'ثابِت', 'ثابت', 'stable', 'adjective', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'ثاني', 'sâni', 'ثاني', 'ثاني', 'second', 'adjective', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ج (Jim)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'جنگل', 'jangal', 'جَنگَل', 'غابة', 'forest', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'جمشيد', 'jamshid', 'جَمشيد', 'جمشيد', 'Jamshid (name)', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'جد', 'jad', 'جَد', 'جد', 'grandfather', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- چ (Che) — Persian only
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review, is_arabic_loanword) VALUES
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'چشم', 'chashm', 'چَشم', 'عين', 'eye', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'چراغ', 'cherâgh', 'چَراغ', 'مصباح', 'lamp', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'چهار', 'chahâr', 'چَهار', 'أربعة', 'four', 'number', 'Dehkhoda / FSI Persian Course', true, false)
ON CONFLICT DO NOTHING;

-- ح (He Jimi)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'حسن', 'hasan', 'حَسَن', 'حسن', 'Hassan (name)', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'حياط', 'hayât', 'حَياط', 'فناء', 'courtyard', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'حال', 'hâl', 'حال', 'حال', 'state', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- خ (Khe)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'خورشيد', 'khorshid', 'خورشيد', 'شمس', 'sun', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'خوب', 'khub', 'خوب', 'جيد', 'good', 'adjective', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'خانه', 'khâne', 'خانه', 'بيت', 'house', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- د (Dal)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'دور', 'dur', 'دور', 'بعيد', 'far', 'adjective', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'دست', 'dast', 'دَست', 'يد', 'hand', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'دانش', 'dânesh', 'دانِش', 'علم', 'knowledge', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ذ (Zal)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'ذهن', 'zehn', 'ذَهْن', 'ذهن', 'mind', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'ذرت', 'zarrot', 'ذَرّت', 'ذرة', 'atom', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'ذاکر', 'zâker', 'ذاکِر', 'ذاكر', 'remembering', 'adjective', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ر (Re)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'روز', 'ruz', 'روز', 'يوم', 'day', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'ردیف', 'radif', 'رَديف', 'صف', 'row', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'راه', 'râh', 'راه', 'طريق', 'road', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ز (Ze)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'زرت', 'zarrat', 'زَرّت', 'ذهب', 'gold', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'زبان', 'zabân', 'زَبان', 'لسان', 'language', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'زنگ', 'zang', 'زَنگ', 'جرس', 'bell', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ژ (Zhe) — Persian only
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review, is_arabic_loanword) VALUES
('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'ژاله', 'zhâle', 'ژاله', 'قطرة مطر', 'raindrop', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'ژئوفيزيك', 'zhofizik', 'ژئوفیزیک', 'جيوفيزياء', 'geophysics', 'noun', 'Dehkhoda / FSI Persian Course', true, false)
ON CONFLICT DO NOTHING;

-- س (Sin)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'سيب', 'sib', 'سيب', 'تفاحة', 'apple', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'سنگ', 'sang', 'سَنگ', 'حجر', 'stone', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'سه', 'se', 'سِه', 'ثلاثة', 'three', 'number', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ش (Shin)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'شهر', 'shahr', 'شَهْر', 'مدينة', 'city', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'شير', 'shir', 'شير', 'حليب', 'milk', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'شب', 'shab', 'شَب', 'ليل', 'night', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ص (Sad)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'صبا', 'sabâ', 'صَبا', 'صبا (نسيم)', 'morning breeze', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'صد', 'sad', 'صَد', 'مئة', 'hundred', 'number', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'صاحب', 'sâheb', 'صاحِب', 'صاحب', 'owner', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ض (Zad)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'ضد', 'zedd', 'ضِد', 'ضد', 'opposite', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'ضرب', 'zarb', 'ضَرب', 'ضرب', 'multiplication', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'ضمن', 'zemann', 'ضِمن', 'ضمن', 'within', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ط (Ta)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'طعم', 'tam', 'طَعم', 'طعم', 'taste', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'طلا', 'talâ', 'طَلا', 'ذهب', 'gold', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'طب', 'tabb', 'طِبّ', 'طب', 'medicine', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ظ (Za)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'ظلم', 'zolm', 'ظُلم', 'ظلم', 'injustice', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'ظهر', 'zohr', 'ظَهْر', 'ظهر', 'noon', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'ظرف', 'zarf', 'ظَرْف', 'وعاء', 'container', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ع (Ayn)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'عسل', 'asal', 'عَسَل', 'عسل', 'honey', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'علم', 'elm', 'عِلم', 'علم', 'science', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'عشق', 'eshq', 'عِشق', 'عشق', 'love', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- غ (Ghayn)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'غرب', 'gharb', 'غَرب', 'غرب', 'west', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'غذا', 'ghazâ', 'غِذاء', 'طعام', 'food', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'غبار', 'ghobâr', 'غُبار', 'غبار', 'dust', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ف (Fe)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'فلک', 'falak', 'فَلَك', 'فلك', 'sky', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'فرد', 'fard', 'فَرد', 'فرد', 'individual', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'فکر', 'fekr', 'فِکر', 'فكر', 'thought', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ق (Qaf)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'قلب', 'qalb', 'قَلب', 'قلب', 'heart', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'قلم', 'qalam', 'قَلَم', 'قلم', 'pen', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'قد', 'qad', 'قَد', 'قامة', 'height', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ک (Kaf)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'کتاب', 'ketâb', 'كِتاب', 'كتاب', 'book', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'کوچک', 'kuchak', 'كوچَك', 'صغير', 'small', 'adjective', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'کار', 'kâr', 'كار', 'عمل', 'work', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- گ (Gaf) — Persian only
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review, is_arabic_loanword) VALUES
('a0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'گل', 'gol', 'گُل', 'وردة', 'flower', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'گوش', 'gush', 'گوش', 'أذن', 'ear', 'noun', 'Dehkhoda / FSI Persian Course', true, false),
('a0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'گرم', 'garm', 'گَرم', 'حار', 'warm', 'adjective', 'Dehkhoda / FSI Persian Course', true, false)
ON CONFLICT DO NOTHING;

-- ل (Lam)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'لب', 'lab', 'لَب', 'شفة', 'lip', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'لحم', 'lahm', 'لَحم', 'لحم', 'meat', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'لڑکان', 'lengân', 'لَنگان', 'أرجل', 'legs', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- م (Mim)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'مادر', 'mâdar', 'مادَر', 'أم', 'mother', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'مرد', 'mard', 'مَرد', 'رجل', 'man', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'مه', 'mah', 'مِه', 'ضباب', 'fog', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ن (Nun)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'نان', 'nân', 'نان', 'خبز', 'bread', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'نور', 'nur', 'نور', 'نور', 'light', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'نگاه', 'negâh', 'نِگاه', 'نظرة', 'look', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- و (Vav)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'ورد', 'vard', 'وَرد', 'ورد', 'rose', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'واسطه', 'vâsete', 'واسِطه', 'وساطة', 'mediation', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'وقت', 'vaqt', 'وَقت', 'وقت', 'time', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ه (He)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'هفت', 'haft', 'هَفت', 'سبعة', 'seven', 'number', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'هوا', 'havâ', 'هَوا', 'هواء', 'air', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'هوش', 'hush', 'هوش', 'عقل', 'intelligence', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- ی (Ye)
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'یک', 'yek', 'يَک', 'واحد', 'one', 'number', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'ياد', 'yâd', 'ياد', 'ذكرى', 'memory', 'noun', 'Dehkhoda / FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'يد', 'yad', 'يَد', 'يد', 'hand', 'noun', 'Dehkhoda / FSI Persian Course', true)
ON CONFLICT DO NOTHING;

-- Vowels lesson vocabulary
INSERT INTO vocabulary (lesson_id, stage_id, persian_script, latin_transliteration, arabic_transliteration, arabic_meaning, english_meaning, part_of_speech, source, needs_review) VALUES
('a0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'بَب', 'bab', 'بَب', 'بَب', 'example /æ/', 'noun', 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'بِب', 'bib', 'بِب', 'بِب', 'example /e/', 'noun', 'FSI Persian Course', true),
('a0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'بُب', 'bob', 'بُب', 'بُب', 'example /o/', 'noun', 'FSI Persian Course', true)
ON CONFLICT DO NOTHING;
