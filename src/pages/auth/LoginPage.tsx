import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/utils';
import { useIsRTL } from '@/lib/useIsRTL';

export function LoginPage() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useAuthStore();

  const stateData = location.state as { signedUp?: boolean; email?: string; from?: { pathname?: string } | string } | null;
  const [email, setEmail] = useState(stateData?.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const showSignedUpNotice = !!stateData?.signedUp;
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = t('auth.error.emailRequired');
    else if (!isValidEmail(email)) e.email = t('auth.error.emailInvalid');
    if (!password) e.password = t('auth.error.passwordRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleResendConfirmation = async () => {
    if (!email || !isValidEmail(email)) {
      setErrors({ email: t('auth.error.emailInvalid') });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        setAuthError(error.message);
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to resend confirmation email');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAuthError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        await fetchProfile();
        const fromTarget = typeof stateData?.from === 'object' && stateData?.from?.pathname ? stateData.from.pathname : (stateData?.from ?? '/learn');
        navigate(fromTarget, { replace: true });
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string; status?: number } | null;
      const code = authErr?.code ?? '';
      const msg = authErr?.message ?? '';

      if (code === 'invalid_credentials' || authErr?.status === 400 || msg.includes('Invalid login')) {
        setAuthError(t('auth.error.loginFailed'));
      } else if (code === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
        setAuthError(
          isRTL
            ? 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى مراجعة صندوق الوارد والضغط على رابط التفعيل.'
            : 'Email not confirmed yet. Please check your inbox or click resend below.',
        );
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setAuthError(t('auth.error.network'));
      } else {
        setAuthError(t('auth.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')} mascotMood="encouraging">
      {/* Sign up confirmation notice banner */}
      {showSignedUpNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 p-4 text-sm text-success-800 dark:text-success-200"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={20} className="shrink-0 text-success-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">
                {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}
              </p>
              <p className="text-xs mt-1 leading-relaxed text-muted">
                {isRTL
                  ? 'تم إرسال رابط تأكيد إلى بريدك. يرجى تفعيل الحساب ثم تسجيل الدخول.'
                  : 'A confirmation link has been sent to your email. Please activate your account then login.'}
              </p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="mt-2 text-xs font-bold text-success-700 dark:text-success-300 hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                {isRTL ? 'إعادة إرسال رسالة التأكيد' : 'Resend confirmation email'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {resendSuccess && (
        <div className="mb-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-3 text-xs text-primary-700 dark:text-primary-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <p>{isRTL ? 'تمت إعادة إرسال رسالة التأكيد بنجاح!' : 'Confirmation email resent successfully!'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300 flex items-start gap-2"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{authError}</p>
              {authError.includes('تأكيد') && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-1 text-xs font-semibold underline block"
                >
                  {isRTL ? 'إعادة إرسال رابط التأكيد الآن' : 'Resend link now'}
                </button>
              )}
            </div>
          </motion.div>
        )}

        <Input
          type="email"
          name="email"
          label={t('auth.field.email')}
          placeholder={t('auth.field.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          icon={<Mail size={18} />}
          autoComplete="email"
          dir="ltr"
        />

        <Input
          type="password"
          name="password"
          label={t('auth.field.password')}
          placeholder={t('auth.field.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          icon={<Lock size={18} />}
          autoComplete="current-password"
          dir="ltr"
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {t('auth.button.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {t('auth.button.login')}
        </Button>

        <p className="text-center text-sm text-muted pt-2">
          {t('auth.button.noAccount')}{' '}
          <Link to="/signup" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            {t('auth.button.createAccount')}
          </Link>
        </p>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary-500 transition-colors"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t('nav.home')}
        </Link>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
