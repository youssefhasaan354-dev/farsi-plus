import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Layers, User, MoreHorizontal, ShoppingBag, Trophy, Award, BarChart3 } from 'lucide-react';

export function Sidebar() {
  const { t } = useTranslation();

  const items = [
    { path: '/learn', icon: BookOpen, labelKey: 'nav.learn' },
    { path: '/flashcards', icon: Layers, labelKey: 'nav.flashcards' },
    { path: '/shop', icon: ShoppingBag, labelKey: 'nav.shop' },
    { path: '/achievements', icon: Trophy, labelKey: 'nav.achievements' },
    { path: '/leaderboard', icon: BarChart3, labelKey: 'nav.leaderboard' },
    { path: '/certificates', icon: Award, labelKey: 'nav.certificates' },
    { path: '/profile', icon: User, labelKey: 'nav.profile' },
    { path: '/more', icon: MoreHorizontal, labelKey: 'nav.more' },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 start-0 w-64 z-30 flex-col border-e border-neutral-200 dark:border-neutral-800 bg-app pt-20 px-4">
      <nav className="flex flex-col gap-1 mt-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-primary-600',
                ].join(' ')
              }
            >
              <Icon size={22} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
