/**
 * Type definitions for exercises and lessons
 */

export type ExerciseType =
  | 'multiple_choice'
  | 'word_matching'
  | 'listening'
  | 'fill_blank'
  | 'picture_word'
  | 'letter_tracing'
  | 'typing_persian'
  | 'sentence_building'
  | 'translation'
  | 'pronunciation'
  | 'dialogue_roleplay'
  | 'story_reading';

export interface MultipleChoiceData {
  display: string;
  options: string[];
  correct: string;
}

export interface WordMatchingData {
  pairs: { left: string; right: string }[];
}

export interface ListeningData {
  text_to_speak: string;
  question: string;
  options: string[];
  correct: string;
}

export interface FillBlankData {
  display: string;
  word: string;
  options: string[];
  correct: string;
  blank_position: 'start' | 'middle' | 'end';
}

export interface PictureWordData {
  word: string;
  options: string[];
  correct: string;
}

export interface LetterTracingData {
  letter: string;
  passing_score: number;
}

export interface TypingPersianData {
  prompt: string;
  correct: string;
  placeholder: string;
}

export interface SentenceBuildingData {
  words: string[];
  correct_order: string[];
  translation_ar: string;
  translation_en: string;
}

export interface TranslationData {
  direction: 'ar_to_fa' | 'fa_to_ar';
  source_text: string;
  correct: string;
  hint: string;
}

export interface PronunciationData {
  text_to_speak: string;
  passing_score: number;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  type: ExerciseType;
  question_ar: string | null;
  question_en: string | null;
  data: Record<string, unknown>;
  correct_answer: unknown;
  hints_ar: string | null;
  hints_en: string | null;
  sort_order: number;
}

export interface Lesson {
  id: string;
  unit_id: string;
  title_ar: string;
  title_en: string;
  title_fa: string;
  description_ar: string | null;
  description_en: string | null;
  sort_order: number;
  xp_reward: number;
  grammar_note_ar: string | null;
  grammar_note_en: string | null;
  cultural_note_ar: string | null;
  cultural_note_en: string | null;
  is_locked: boolean;
}

export interface Unit {
  id: string;
  stage_id: string;
  title_ar: string;
  title_en: string;
  title_fa: string;
  description_ar: string | null;
  description_en: string | null;
  sort_order: number;
  is_locked: boolean;
  lessons?: Lesson[];
}

export interface Stage {
  id: string;
  cefr_level: string;
  title_ar: string;
  title_en: string;
  title_fa: string;
  description_ar: string | null;
  description_en: string | null;
  sort_order: number;
  units?: Unit[];
}

export interface VocabularyItem {
  id: string;
  lesson_id: string | null;
  persian_script: string;
  latin_transliteration: string;
  arabic_transliteration: string | null;
  arabic_meaning: string;
  english_meaning: string;
  audio_url: string | null;
  part_of_speech: string | null;
  is_arabic_loanword: boolean;
  arabic_origin_note: string | null;
}
