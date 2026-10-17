import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-lg p-2 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

export default ThemeToggle;
