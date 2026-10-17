/**
 * Persian language utilities — correct letter handling, transliteration keys, etc.
 */

/** The 32 letters of the Persian alphabet in standard order */
export const PERSIAN_ALPHABET = [
  { letter: 'آ', name: 'alef madda', isolated: 'آ', initial: 'آ', medial: 'آ', final: 'آ' },
  { letter: 'ا', name: 'alef', isolated: 'ا', initial: 'اـ', medial: 'ـاـ', final: 'ـا' },
  { letter: 'ب', name: 'be', isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
  { letter: 'پ', name: 'pe', isolated: 'پ', initial: 'پـ', medial: 'ـپـ', final: 'ـپ' },
  { letter: 'ت', name: 'te', isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
  { letter: 'ث', name: 'se', isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
  { letter: 'ج', name: 'jim', isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
  { letter: 'چ', name: 'che', isolated: 'چ', initial: 'چـ', medial: 'ـچـ', final: 'ـچ' },
  { letter: 'ح', name: 'he jimi', isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
  { letter: 'خ', name: 'khe', isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
  { letter: 'د', name: 'dal', isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
  { letter: 'ذ', name: 'zal', isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
  { letter: 'ر', name: 're', isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
  { letter: 'ز', name: 'ze', isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
  { letter: 'ژ', name: 'zhe', isolated: 'ژ', initial: 'ژ', medial: 'ـژ', final: 'ـژ' },
  { letter: 'س', name: 'sin', isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
  { letter: 'ش', name: 'shin', isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
  { letter: 'ص', name: 'sad', isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
  { letter: 'ض', name: 'zad', isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
  { letter: 'ط', name: 'ta', isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
  { letter: 'ظ', name: 'za', isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
  { letter: 'ع', name: 'ayn', isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
  { letter: 'غ', name: 'ghayn', isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
  { letter: 'ف', name: 'fe', isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
  { letter: 'ق', name: 'qaf', isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
  { letter: 'ک', name: 'kaf', isolated: 'ک', initial: 'کـ', medial: 'ـکـ', final: 'ـک' },
  { letter: 'گ', name: 'gaf', isolated: 'گ', initial: 'گـ', medial: 'ـگـ', final: 'ـگ' },
  { letter: 'ل', name: 'lam', isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
  { letter: 'م', name: 'mim', isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
  { letter: 'ن', name: 'nun', isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
  { letter: 'و', name: 'vav', isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
  { letter: 'ه', name: 'he', isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
  { letter: 'ی', name: 'ye', isolated: 'ی', initial: 'یـ', medial: 'ـیـ', final: 'ـی' },
] as const;

/** Persian-specific letters not in Arabic */
export const PERSIAN_ONLY_LETTERS = ['پ', 'چ', 'ژ', 'گ'];

/** Persian vowels (diacritics) */
export const PERSIAN_VOWELS = [
  { diacritic: 'َ', name: 'fatha', sound: '/æ/' },
  { diacritic: 'ِ', name: 'kasra', sound: '/e/' },
  { diacritic: 'ُ', name: 'damma', sound: '/o/' },
  { diacritic: 'ً', name: 'tanwin fath', sound: '/æn/' },
  { diacritic: 'ٍ', name: 'tanwin kasr', sound: '/en/' },
  { diacritic: 'ٌ', name: 'tanwin damm', sound: '/on/' },
] as const;

/** Zero-width non-joiner (ZWNJ) — نیم‌فاصله */
export const ZWNJ = '\u200C';

/** CEFR levels used in the curriculum */
export const CEFR_LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CEFRLevel = (typeof CEFR_LEVELS)[number];

/** CEFR level labels in Arabic and English */
export const CEFR_LABELS: Record<CEFRLevel, { ar: string; en: string }> = {
  A0: { ar: 'مبتدئ تماماً', en: 'Complete beginner' },
  A1: { ar: 'مبتدئ', en: 'Beginner' },
  A2: { ar: 'داخلي في المبتدئين', en: 'Elementary' },
  B1: { ar: 'متوسط', en: 'Intermediate' },
  B2: { ar: 'فوق المتوسط', en: 'Upper intermediate' },
  C1: { ar: 'متقدّم', en: 'Advanced' },
};

/** Persian number words 0-10 */
export const PERSIAN_NUMBERS = [
  'صفر', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده',
];
