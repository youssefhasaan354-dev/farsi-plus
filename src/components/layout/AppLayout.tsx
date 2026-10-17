import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export function AppLayout() {
  const location = useLocation();

  const activeTab = (() => {
    if (location.pathname.startsWith('/flashcards')) return 'flashcards' as const;
    if (location.pathname.startsWith('/shop')) return 'shop' as const;
    if (location.pathname.startsWith('/achievements')) return 'achievements' as const;
    if (location.pathname.startsWith('/leaderboard')) return 'more' as const;
    if (location.pathname.startsWith('/certificates')) return 'more' as const;
    if (location.pathname.startsWith('/profile')) return 'profile' as const;
    if (location.pathname.startsWith('/more')) return 'more' as const;
    return 'learn' as const;
  })();

  return (
    <div className="min-h-dvh bg-app">
      <Header variant="app" />
      <Sidebar />
      <main className="lg:ps-64 pb-20 lg:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      <BottomNav active={activeTab} />
    </div>
  );
}

export default AppLayout;
