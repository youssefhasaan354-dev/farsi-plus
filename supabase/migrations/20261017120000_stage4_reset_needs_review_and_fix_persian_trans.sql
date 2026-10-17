-- Migration: 20261017120000_stage4_reset_needs_review_and_fix_persian_trans.sql
-- Description: Reset needs_review on unverified/generated content, add review metadata,
-- normalize Persian characters across all content tables, and add auto-normalization triggers.

-- 1. Add review tracking columns
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 2. Reset needs_review = true for all generated/unreviewed content
-- Keep only documented FSI Persian Course verified content as false
UPDATE exercises
SET needs_review = true, updated_at = now()
WHERE source IS NULL OR (source NOT LIKE '%FSI Persian Course%' AND source != 'FSI Persian Course');

UPDATE vocabulary
SET needs_review = true, updated_at = now()
WHERE source IS NULL OR (source NOT LIKE '%FSI Persian Course%' AND source != 'FSI Persian Course');

UPDATE lessons
SET needs_review = true, updated_at = now()
WHERE source IS NULL OR (source NOT LIKE '%FSI Persian Course%' AND source != 'FSI Persian Course');

-- 3. Unconditional Persian text normalization (Arabic ي and ك -> Persian ی and ک)
-- Vocabulary
UPDATE vocabulary
SET persian_script = translate(persian_script, 'يك', 'یک'),
    updated_at = now()
WHERE persian_script ~ '[يك]';

-- Exercises question_fa
UPDATE exercises
SET question_fa = translate(question_fa, 'يك', 'یک'),
    updated_at = now()
WHERE question_fa IS NOT NULL AND question_fa ~ '[يك]';

-- Exercises data JSON
UPDATE exercises
SET data = translate(data::text, 'يك', 'یک')::jsonb,
    updated_at = now()
WHERE data::text ~ '[يك]';

-- Exercises correct_answer JSON
UPDATE exercises
SET correct_answer = translate(correct_answer::text, 'يك', 'یک')::jsonb,
    updated_at = now()
WHERE correct_answer IS NOT NULL AND correct_answer::text ~ '[يك]';

-- Lessons
UPDATE lessons
SET title_fa = translate(title_fa, 'يك', 'یک'),
    updated_at = now()
WHERE title_fa ~ '[يك]';

-- Units
UPDATE units
SET title_fa = translate(title_fa, 'يك', 'یک'),
    updated_at = now()
WHERE title_fa ~ '[يك]';

-- Stages
UPDATE stages
SET title_fa = translate(title_fa, 'يك', 'یک'),
    updated_at = now()
WHERE title_fa ~ '[يك]';

-- 4. Normalization trigger function
CREATE OR REPLACE FUNCTION trg_normalize_persian_script()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'vocabulary' THEN
    IF NEW.persian_script IS NOT NULL THEN
      NEW.persian_script := translate(NEW.persian_script, 'يك', 'یک');
    END IF;
  ELSIF TG_TABLE_NAME = 'exercises' THEN
    IF NEW.question_fa IS NOT NULL THEN
      NEW.question_fa := translate(NEW.question_fa, 'يك', 'یک');
    END IF;
    IF NEW.data IS NOT NULL THEN
      NEW.data := translate(NEW.data::text, 'يك', 'یک')::jsonb;
    END IF;
    IF NEW.correct_answer IS NOT NULL THEN
      NEW.correct_answer := translate(NEW.correct_answer::text, 'يك', 'یک')::jsonb;
    END IF;
  ELSIF TG_TABLE_NAME = 'lessons' THEN
    IF NEW.title_fa IS NOT NULL THEN
      NEW.title_fa := translate(NEW.title_fa, 'يك', 'یک');
    END IF;
  ELSIF TG_TABLE_NAME = 'units' THEN
    IF NEW.title_fa IS NOT NULL THEN
      NEW.title_fa := translate(NEW.title_fa, 'يك', 'یک');
    END IF;
  ELSIF TG_TABLE_NAME = 'stages' THEN
    IF NEW.title_fa IS NOT NULL THEN
      NEW.title_fa := translate(NEW.title_fa, 'يك', 'یک');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to content tables
DROP TRIGGER IF EXISTS trg_norm_vocab_persian ON vocabulary;
CREATE TRIGGER trg_norm_vocab_persian
  BEFORE INSERT OR UPDATE ON vocabulary
  FOR EACH ROW EXECUTE FUNCTION trg_normalize_persian_script();

DROP TRIGGER IF EXISTS trg_norm_exercises_persian ON exercises;
CREATE TRIGGER trg_norm_exercises_persian
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION trg_normalize_persian_script();

DROP TRIGGER IF EXISTS trg_norm_lessons_persian ON lessons;
CREATE TRIGGER trg_norm_lessons_persian
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION trg_normalize_persian_script();

DROP TRIGGER IF EXISTS trg_norm_units_persian ON units;
CREATE TRIGGER trg_norm_units_persian
  BEFORE INSERT OR UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION trg_normalize_persian_script();

DROP TRIGGER IF EXISTS trg_norm_stages_persian ON stages;
CREATE TRIGGER trg_norm_stages_persian
  BEFORE INSERT OR UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION trg_normalize_persian_script();

-- 5. Add check constraint on vocabulary to guarantee integrity
ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_persian_script_no_arabic;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_persian_script_no_arabic CHECK (persian_script !~ '[يك]');
