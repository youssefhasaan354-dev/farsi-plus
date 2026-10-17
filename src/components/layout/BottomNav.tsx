import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Layers, User, Menu, ShoppingBag, Trophy } from 'lucide-react';

interface BottomNavProps {
  active: 'learn' | 'flashcards' | 'shop' | 'achievements' | 'profile' | 'more';
}

const items = [
  { key: 'learn', path: '/learn', icon: BookOpen, labelKey: 'nav.learn' },
  { key: 'flashcards', path: '/flashcards', icon: Layers, labelKey: 'nav.flashcards' },
  { key: 'shop', path: '/shop', icon: ShoppingBag, labelKey: 'nav.shop' },
  { key: 'achievements', path: '/achievements', icon: Trophy, labelKey: 'nav.achievements' },
  { key: 'profile', path: '/profile', icon: User, labelKey: 'nav.profile' },
  { key: 'more', path: '/more', icon: Menu, labelKey: 'nav.more' },
] as const;

export function BottomNav({ active }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-app/95 backdrop-blur-md safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={[
                'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 transition-colors min-w-[64px]',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-muted hover:text-primary-500',
              ].join(' ')}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-semibold">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
