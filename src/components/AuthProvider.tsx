import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    let mounted = true;

    // Get initial session safely with try/finally
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!error && data?.session) {
          setSession(data.session);
          await fetchProfile();
        } else {
          setSession(null);
        }
      } catch (err) {
        console.warn('Initial auth getSession error:', err);
      } finally {
        if (mounted) {
          useAuthStore.setState({ initializing: false });
        }
      }
    })();

    // Listen for auth state changes — only fetch profile on SIGNED_IN & USER_UPDATED
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        // Redirect to password reset page if recovery token detected
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/reset-password')) {
          window.location.href = '/reset-password';
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session) {
          fetchProfile();
        }
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update document direction when language changes
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language]);

  return <>{children}</>;
}
