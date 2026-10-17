import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, Info, Shield, FileText, Mail, ShoppingBag, Trophy, BarChart3, Award, LayoutDashboard } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

export function MorePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links = [
    { icon: ShoppingBag, label: t('nav.shop'), path: '/shop' },
    { icon: Trophy, label: t('nav.achievements'), path: '/achievements' },
    { icon: BarChart3, label: t('nav.leaderboard'), path: '/leaderboard' },
    { icon: Award, label: t('nav.certificates'), path: '/certificates' },
    { icon: Info, label: t('nav.about'), path: '/about' },
    { icon: FileText, label: t('nav.privacy'), path: '/privacy' },
    { icon: Shield, label: t('nav.terms'), path: '/terms' },
    { icon: Mail, label: t('nav.contact'), path: '/contact' },
  ];

  const adminLink = profile?.role === 'admin'
    ? { icon: LayoutDashboard, label: t('admin.title'), path: '/admin' }
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.more')}</h1>

      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white font-bold">
            {(profile?.display_name ?? '?')[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold">{profile?.display_name || '—'}</p>
            <p className="text-sm text-muted" dir="ltr">{profile?.email}</p>
          </div>
        </div>
        <Button variant="danger" fullWidth icon={<LogOut size={18} />} onClick={handleSignOut}>
          {t('auth.button.logout')}
        </Button>
      </Card>

      <Card padding="md">
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Icon size={20} className="text-muted" />
                <span className="font-medium">{link.label}</span>
              </button>
            );
          })}
          {adminLink && (
            <>
              <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" />
              <button
                onClick={() => navigate(adminLink.path)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-start hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <adminLink.icon size={20} className="text-primary-600" />
                <span className="font-semibold text-primary-600">{adminLink.label}</span>
              </button>
            </>
          )}
        </nav>
      </Card>

      <p className="text-center text-xs text-muted">
        {APP_CONFIG.nameEn} v1.0
      </p>
    </div>
  );
}

export default MorePage;
