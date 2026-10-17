import { describe, it, expect } from 'vitest';
import {
  normalizePersianStrict,
  normalizePersianArabic,
  normalizePersianScript,
  normalizeDigits,
  stripDiacritics,
  comparePersianText,
  textMatches,
  ZWNJ,
} from '@/lib/textNormalize';
import { isCorrectAnswer, getCorrectAnswerText } from '@/lib/exercise';
import { toPersianDigits, toArabicDigits, formatNumber } from '@/lib/utils';
import { computeLessonStatus } from '@/lib/lessonStatus';
import type { Exercise } from '@/types/lesson';

function createMockExercise(
  type: Exercise['type'],
  data: Record<string, unknown>,
  extra: Partial<Exercise> = {},
): Exercise {
  return {
    id: 'ex-mock',
    lesson_id: 'lesson-mock',
    type,
    question_ar: null,
    question_en: null,
    data,
    correct_answer: null,
    hints_ar: null,
    hints_en: null,
    sort_order: 1,
    ...extra,
  };
}

describe('1. Persian Text Normalization (textNormalize)', () => {
  it('distinguishes "آ" (Alef Madda) from "ا" (Plain Alef)', () => {
    // Crucial pedagogical requirement: "آب" (water) != "اب"
    expect(normalizePersianStrict('آب')).not.toEqual(normalizePersianStrict('اب'));
    expect(textMatches('آب', 'اب')).toBe(false);
  });

  it('normalizes Arabic Yeh (ي) and Kaf (ك) to Persian (ی and ک)', () => {
    expect(normalizePersianScript('تيك')).toBe('تیک');
    expect(normalizePersianScript('كتاب')).toBe('کتاب');
    expect(normalizePersianScript('علي')).toBe('علی');
    expect(textMatches('کتاب', 'كتاب')).toBe(true);
    expect(textMatches('علی', 'علي')).toBe(true);
  });

  it('normalizes Arabic-Indic and Persian digits to ASCII', () => {
    expect(normalizeDigits('١٢٣٤٥')).toBe('12345');
    expect(normalizeDigits('۱۲۳۴۵')).toBe('12345');
    expect(normalizeDigits('شماره ۱۲')).toBe('شماره 12');
  });

  it('strips Arabic and Persian diacritics (harakat / tanween)', () => {
    expect(stripDiacritics('سَلامٌ')).toBe('سلام');
    expect(stripDiacritics('خُوش')).toBe('خوش');
  });

  it('tolerates ZWNJ differences with close-match note', () => {
    const withZwnj = `می${ZWNJ}خورم`;
    const withoutZwnj = 'میخورم';

    const result = comparePersianText(withZwnj, withoutZwnj);
    expect(result.match).toBe(true);
    expect(result.closeMatch).toBe(true);
    expect(result.note).toBeDefined();
    expect(textMatches(withZwnj, withoutZwnj)).toBe(true);
    expect(normalizePersianArabic(withZwnj)).toBe('میخورم');
  });
});

describe('2. Exercise Validation (isCorrectAnswer)', () => {
  it('validates multiple_choice correctly', () => {
    const exercise = createMockExercise('multiple_choice', {
      correct: 'آ',
      options: ['آ', 'ا', 'ب', 'ت'],
    });
    expect(isCorrectAnswer(exercise, 'آ')).toBe(true);
    expect(isCorrectAnswer(exercise, 'ا')).toBe(false);
  });

  it('validates fill_blank and listening correctly', () => {
    const fillBlank = createMockExercise('fill_blank', {
      correct: 'پ',
      options: ['پ', 'ب'],
    });
    expect(isCorrectAnswer(fillBlank, 'پ')).toBe(true);
    expect(isCorrectAnswer(fillBlank, 'ب')).toBe(false);
  });

  it('validates word_matching regardless of pair submission order', () => {
    const exercise = createMockExercise('word_matching', {
      pairs: [
        { left: 'آب', right: 'ماء' },
        { left: 'نان', right: 'خبز' },
      ],
    });

    // Submitting reverse order of pairs
    const submission = JSON.stringify([
      { left: 'نان', right: 'خبز' },
      { left: 'آب', right: 'ماء' },
    ]);
    expect(isCorrectAnswer(exercise, submission)).toBe(true);

    const wrongSubmission = JSON.stringify([
      { left: 'آب', right: 'خبز' },
      { left: 'نان', right: 'ماء' },
    ]);
    expect(isCorrectAnswer(exercise, wrongSubmission)).toBe(false);
  });

  it('validates sentence_building tokens in strict order', () => {
    const exercise = createMockExercise('sentence_building', {
      correct_order: ['من', 'آب', 'می‌نوشم'],
    });

    expect(isCorrectAnswer(exercise, JSON.stringify(['من', 'آب', 'می‌نوشم']))).toBe(true);
    expect(isCorrectAnswer(exercise, JSON.stringify(['آب', 'من', 'می‌نوشم']))).toBe(false);
  });

  it('validates typing_persian with Persian normalization', () => {
    const exercise = createMockExercise('typing_persian', {
      correct: 'کتاب',
    });

    expect(isCorrectAnswer(exercise, 'کتاب')).toBe(true);
    expect(isCorrectAnswer(exercise, 'كتاب')).toBe(true); // Arabic kaf accepted via normalization
    expect(isCorrectAnswer(exercise, 'دفتر')).toBe(false);
  });

  it('validates letter_tracing based on passing score threshold', () => {
    const exercise = createMockExercise('letter_tracing', {
      passing_score: 60,
    });

    expect(isCorrectAnswer(exercise, '75')).toBe(true);
    expect(isCorrectAnswer(exercise, '45')).toBe(false);
  });

  it('validates pronunciation without blocking', () => {
    const exercise = createMockExercise('pronunciation', {
      text: 'سلام',
    });

    expect(isCorrectAnswer(exercise, 'anything')).toBe(true);
    expect(isCorrectAnswer(exercise, '')).toBe(false);
  });
});

describe('3. getCorrectAnswerText', () => {
  it('returns proper string without crashes for multiple_choice', () => {
    const ex = createMockExercise('multiple_choice', { correct: 'آ' });
    expect(getCorrectAnswerText(ex)).toBe('آ');
  });

  it('joins sentence_building correct_order cleanly', () => {
    const ex = createMockExercise('sentence_building', {
      correct_order: ['من', 'فارسی', 'دوست', 'دارم'],
    });
    expect(getCorrectAnswerText(ex)).toBe('من فارسی دوست دارم');
  });

  it('formats word_matching pairs without error', () => {
    const ex = createMockExercise('word_matching', {
      pairs: [
        { left: 'آب', right: 'ماء' },
        { left: 'پدر', right: 'أب' },
      ],
    });
    expect(getCorrectAnswerText(ex)).toBe('آب ↔ ماء ، پدر ↔ أب');
  });
});

describe('4. Number Formatting (utils)', () => {
  it('converts digits to Persian script digits', () => {
    expect(toPersianDigits(123)).toBe('۱۲۳');
    expect(toPersianDigits('2026')).toBe('۲۰۲۶');
  });

  it('converts digits to Arabic digits', () => {
    expect(toArabicDigits(123)).toBe('١٢٣');
  });

  it('respects UI language in formatNumber', () => {
    expect(formatNumber(42, 'en')).toBe('42');
    expect(formatNumber(42, 'ar')).toBe('٤٢');
  });
});

describe('5. Lesson Status & Progression (computeLessonStatus)', () => {
  it('makes lesson 1 available when user is new (no progress record)', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: false,
      lessonIndex: 0,
      prevLessonCompleted: false,
      userProgressStatus: null,
    });
    expect(status).toBe('available');
  });

  it('marks lesson 1 as in_progress if recorded as such', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: false,
      lessonIndex: 0,
      prevLessonCompleted: false,
      userProgressStatus: 'in_progress',
    });
    expect(status).toBe('in_progress');
  });

  it('marks lesson as completed when user progress is completed', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: false,
      lessonIndex: 0,
      prevLessonCompleted: false,
      userProgressStatus: 'completed',
    });
    expect(status).toBe('completed');
  });

  it('keeps subsequent lesson locked if previous lesson is not completed', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: false,
      lessonIndex: 1,
      prevLessonCompleted: false,
      userProgressStatus: null,
    });
    expect(status).toBe('locked');
  });

  it('unlocks subsequent lesson when previous lesson is completed', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: false,
      lessonIndex: 1,
      prevLessonCompleted: true,
      userProgressStatus: null,
    });
    expect(status).toBe('available');
  });

  it('respects database is_locked flag even for lesson 1', () => {
    const status = computeLessonStatus({
      isLessonLockedByDb: true,
      lessonIndex: 0,
      prevLessonCompleted: false,
      userProgressStatus: null,
    });
    expect(status).toBe('locked');
  });
});
