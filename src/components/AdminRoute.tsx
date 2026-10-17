import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { FullScreenSpinner } from '@/components/ui/Spinner';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, initializing } = useAuthStore();
  const location = useLocation();

  if (initializing) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/learn" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
