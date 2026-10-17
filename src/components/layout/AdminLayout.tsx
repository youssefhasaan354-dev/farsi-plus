import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  FolderTree,
  CheckSquare,
  Bug,
  Megaphone,
  Inbox,
  Upload,
  Trophy,
  Users,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'admin.nav.dashboard' },
  { path: '/admin/content', icon: FolderTree, labelKey: 'admin.nav.content' },
  { path: '/admin/review', icon: CheckSquare, labelKey: 'admin.nav.review' },
  { path: '/admin/reports', icon: Bug, labelKey: 'admin.nav.reports' },
  { path: '/admin/ads', icon: Megaphone, labelKey: 'admin.nav.ads' },
  { path: '/admin/feedback', icon: Inbox, labelKey: 'admin.nav.feedback' },
  { path: '/admin/import', icon: Upload, labelKey: 'admin.nav.import' },
  { path: '/admin/leagues', icon: Trophy, labelKey: 'admin.nav.leagues' },
  { path: '/admin/users', icon: Users, labelKey: 'admin.nav.users' },
] as const;

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-bold text-lg text-neutral-900 dark:text-white">
              {t('admin.title')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/learn')}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={16} className="rtl:rotate-180" />
              <span className="hidden sm:inline">{t('admin.backToApp')}</span>
            </button>
            <span className="text-sm text-neutral-500">
              {profile?.display_name || profile?.email}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={[
            'fixed lg:sticky top-[57px] z-30 h-[calc(100dvh-57px)] w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-y-auto transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            'rtl:translate-x-full rtl:lg:translate-x-0',
            sidebarOpen ? 'rtl:translate-x-0' : '',
          ].join(' ')}
        >
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.path)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  ].join(' ')}
                >
                  <Icon size={18} />
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[57px] z-20 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
