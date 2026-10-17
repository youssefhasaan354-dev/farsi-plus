import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import type { Language } from '@/config/app';

type ThemeMode = 'light' | 'dark';

interface UIState {
  language: Language;
  theme: ThemeMode;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

function applyDirection(lang: Language) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

function applyTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const getInitialLanguage = (): Language => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('fp_lang') as Language | null;
    if (saved === 'ar' || saved === 'en') return saved;
  }
  return 'ar';
};

const initialLang = getInitialLanguage();
if (typeof document !== 'undefined') {
  applyDirection(initialLang);
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      language: initialLang,
      theme: 'light',
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        applyDirection(lang);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fp_lang', lang);
        }
        set({ language: lang });
      },
      toggleLanguage: () => {
        const next = get().language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(next);
        applyDirection(next);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('fp_lang', next);
        }
        set({ language: next });
      },
      setTheme: (mode) => {
        applyTheme(mode);
        set({ theme: mode });
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'fp_ui',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDirection(state.language);
          applyTheme(state.theme);
          i18n.changeLanguage(state.language);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('fp_lang', state.language);
          }
        }
      },
    },
  ),
);
