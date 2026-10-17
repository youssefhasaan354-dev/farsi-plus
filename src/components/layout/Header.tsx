import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import Button from '@/components/ui/Button';
import { APP_CONFIG } from '@/config/app';

interface HeaderProps {
  variant?: 'public' | 'app';
}

export function Header({ variant = 'public' }: HeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-app/80 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-lg shadow-sm">
            <span className="font-persian">ف</span>
          </div>
          <div className="hidden sm:block">
            <p className="font-persian text-lg font-bold text-primary-600 dark:text-primary-400 leading-none">
              {APP_CONFIG.nameFa}
            </p>
            <p className="text-xs text-muted leading-none mt-0.5">{APP_CONFIG.nameEn}</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {variant === 'public' && (
            <>
              {user ? (
                <Button size="sm" onClick={() => navigate('/learn')}>
                  {t('nav.learn')}
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                    {t('auth.button.login')}
                  </Button>
                  <Button size="sm" onClick={() => navigate('/signup')}>
                    {t('auth.button.signup')}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
