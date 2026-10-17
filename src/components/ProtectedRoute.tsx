import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { FullScreenSpinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, initializing } = useAuthStore();
  const location = useLocation();

  if (initializing) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Redirect to onboarding if not yet completed
  if (profile && profile.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect away from onboarding if already completed
  if (profile && profile.onboarding_completed === true && location.pathname === '/onboarding') {
    return <Navigate to="/learn" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: ProtectedRouteProps) {
  const { user, profile, initializing } = useAuthStore();

  if (initializing) {
    return <FullScreenSpinner />;
  }

  if (user) {
    if (profile && profile.onboarding_completed === false) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/learn" replace />;
  }

  return <>{children}</>;
}
