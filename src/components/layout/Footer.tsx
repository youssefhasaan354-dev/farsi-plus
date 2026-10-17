import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@/config/app';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-app mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold">
                <span className="font-persian">ف</span>
              </div>
              <span className="font-persian text-lg font-bold text-primary-600 dark:text-primary-400">
                {APP_CONFIG.nameFa}
              </span>
            </div>
            <p className="text-sm text-muted max-w-xs">
              {t('app.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-bold">{t('nav.more')}</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted hover:text-primary-500 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="text-sm text-muted hover:text-primary-500 transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold">{t('nav.terms')}</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-muted hover:text-primary-500 transition-colors">{t('nav.privacy')}</Link></li>
              <li><Link to="/terms" className="text-sm text-muted hover:text-primary-500 transition-colors">{t('nav.terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted">
            &copy; {year} {APP_CONFIG.nameEn}. {t('footer.rights')}.
          </p>
          <p className="text-xs text-muted">{t('footer.madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
