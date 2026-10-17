import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/uiStore';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useUIStore();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label={t('lang.switch')}
      title={t('lang.switch')}
    >
      <Languages size={18} />
      <span>{language === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}

export default LanguageSwitcher;
