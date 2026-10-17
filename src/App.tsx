import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import OnboardingPage from '@/pages/OnboardingPage';
import LearnPage from '@/pages/LearnPage';
import LessonPlayerPage from '@/pages/LessonPlayerPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import ProfilePage from '@/pages/ProfilePage';
import MorePage from '@/pages/MorePage';
import ShopPage from '@/pages/ShopPage';
import AchievementsPage from '@/pages/AchievementsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import CertificatesPage from '@/pages/CertificatesPage';
import {
  AboutPage,
  PrivacyPage,
  TermsPage,
  ContactPage,
  NotFoundPage,
} from '@/pages/SimplePages';

// Lazy-loaded Admin pages (reduces main bundle size significantly)
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminContentPage = lazy(() => import('@/pages/admin/AdminContentPage'));
const AdminReviewPage = lazy(() => import('@/pages/admin/AdminReviewPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminAdsPage = lazy(() => import('@/pages/admin/AdminAdsPage'));
const AdminFeedbackPage = lazy(() => import('@/pages/admin/AdminFeedbackPage'));
const AdminImportPage = lazy(() => import('@/pages/admin/AdminImportPage'));
const AdminLeaguesPage = lazy(() => import('@/pages/admin/AdminLeaguesPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));

function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Auth routes — redirect if already logged in */}
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected user routes */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/lesson/:lessonId" element={<LessonPlayerPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
            </Route>

            {/* Admin routes — lazy loaded and protected server-side via is_admin() */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><AdminDashboardPage /></Suspense>} />
              <Route path="/admin/content" element={<Suspense fallback={<AdminLoading />}><AdminContentPage /></Suspense>} />
              <Route path="/admin/review" element={<Suspense fallback={<AdminLoading />}><AdminReviewPage /></Suspense>} />
              <Route path="/admin/reports" element={<Suspense fallback={<AdminLoading />}><AdminReportsPage /></Suspense>} />
              <Route path="/admin/ads" element={<Suspense fallback={<AdminLoading />}><AdminAdsPage /></Suspense>} />
              <Route path="/admin/feedback" element={<Suspense fallback={<AdminLoading />}><AdminFeedbackPage /></Suspense>} />
              <Route path="/admin/import" element={<Suspense fallback={<AdminLoading />}><AdminImportPage /></Suspense>} />
              <Route path="/admin/leagues" element={<Suspense fallback={<AdminLoading />}><AdminLeaguesPage /></Suspense>} />
              <Route path="/admin/users" element={<Suspense fallback={<AdminLoading />}><AdminUsersPage /></Suspense>} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
