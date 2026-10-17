/**
 * App Configuration — Farsi Plus
 * Change the app name and other global settings here.
 */

export const APP_CONFIG = {
  /** App name in Persian (display) */
  nameFa: 'فارسي بلس',
  /** App name in English / Latin */
  nameEn: 'Farsi Plus',
  /** Short tagline */
  tagline: {
    ar: 'تعلّم الفارسية من الصفر إلى الاحتراف',
    en: 'Learn Persian from zero to fluency',
    fa: 'فارسی را از صفر تا تسلط بیاموزید',
  },
  /** Default interface language */
  defaultLanguage: 'ar' as const,
  /** Supported interface languages */
  supportedLanguages: ['ar', 'en'] as const,
  /** Default daily XP goal */
  defaultDailyGoal: 50,
  /** Starting hearts */
  startingHearts: 5,
  /** Starting gems */
  startingGems: 50,
  /** Contact email */
  contactEmail: 'support@farsiplus.app',
  /** Google OAuth — set to true when the provider is enabled in Supabase */
  googleSignInEnabled: false,
};

export type AppConfig = typeof APP_CONFIG;
export type Language = (typeof APP_CONFIG.supportedLanguages)[number];
