/**
 * Normalizes Arabic and Persian text for fair comparison.
 * Distinguishes 'آ' from 'ا' while harmonizing character variants,
 * digits, and offering close-match tolerance for ZWNJ (Zero-Width Non-Joiner).
 */

const ARABIC_TO_PERSIAN: Record<string, string> = {
  'ي': 'ی', // Arabic yeh → Persian yeh
  'ك': 'ک', // Arabic kaf → Persian kaf
  'ة': 'ه', // Arabic ta marbuta → heh
  'أ': 'ا', // Alef with hamza above → alef
  'إ': 'ا', // Alef with hamza below → alef
  // NOTE: 'آ' (alef madda) is deliberately NOT mapped to 'ا' because
  // it is phonetically and lexically distinct in Persian (e.g. آب ≠ اب).
  'ؤ': 'و', // Waw with hamza → waw
  'ئ': 'ی', // Yeh with hamza → yeh
};

export const ZWNJ = '\u200c'; // Zero-Width Non-Joiner

/**
 * Normalizes Arabic-Indic (٠-٩) and Eastern Arabic / Persian (۰-۹) digits to ASCII (0-9).
 */
export function normalizeDigits(text: string): string {
  if (!text) return '';
  return text
    // Arabic-Indic digits ٠-٩
    .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
    // Persian digits ۰-۹
    .replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48));
}

/**
 * Strips Arabic/Persian diacritics (harakat / tanween / tashdid / dagger alef).
 */
export function stripDiacritics(text: string): string {
  if (!text) return '';
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Strict Persian normalization: replaces Arabic glyphs, harmonizes digits,
 * strips diacritics and whitespace, but PRESERVES 'آ' and ZWNJ.
 */
export function normalizePersianStrict(text: string): string {
  if (!text) return '';

  let result = text;

  // Replace Arabic letter variants with Persian equivalents
  for (const [arabic, persian] of Object.entries(ARABIC_TO_PERSIAN)) {
    result = result.split(arabic).join(persian);
  }

  // Normalize numbers
  result = normalizeDigits(result);

  // Strip diacritics
  result = stripDiacritics(result);

  // Normalize whitespace while preserving ZWNJ
  result = result.trim().replace(/[ \t\r\n]+/g, ' ');

  return result;
}

/**
 * Full normalization including ZWNJ removal.
 */
export function normalizePersianArabic(text: string): string {
  if (!text) return '';
  return normalizePersianStrict(text).split(ZWNJ).join('');
}

export interface ComparisonResult {
  match: boolean;
  closeMatch: boolean;
  note?: string;
}

/**
 * Compares expected and actual Persian strings.
 * - Exact match: characters and ZWNJ match.
 * - Close match: characters match but ZWNJ differs (accepted with note).
 * - No match: wrong characters or 'آ' / 'ا' mismatch.
 */
export function comparePersianText(expected: string, actual: string): ComparisonResult {
  const normExpectedStrict = normalizePersianStrict(expected);
  const normActualStrict = normalizePersianStrict(actual);

  if (normExpectedStrict === normActualStrict) {
    return { match: true, closeMatch: false };
  }

  const normExpectedRelaxed = normExpectedStrict.split(ZWNJ).join('');
  const normActualRelaxed = normActualStrict.split(ZWNJ).join('');

  if (normExpectedRelaxed === normActualRelaxed) {
    return {
      match: true,
      closeMatch: true,
      note: 'ملاحظة: انتبه للمسافة الصغيرة (فاصل مجازي)',
    };
  }

  return { match: false, closeMatch: false };
}

/**
 * Boolean helper for exercise validators. Accepts exact and close matches.
 */
export function textMatches(expected: string, actual: string): boolean {
  return comparePersianText(expected, actual).match;
}

/**
 * Normalizes Arabic Yeh (ي) and Kaf (ك) to Persian equivalents (ی and ک).
 */
export function normalizePersianScript(text: string): string {
  if (!text) return '';
  return text.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9');
}

