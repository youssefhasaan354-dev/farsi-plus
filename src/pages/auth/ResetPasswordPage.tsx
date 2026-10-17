import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useIsRTL } from '@/lib/useIsRTL';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(
        isRTL
          ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
          : 'Password must be at least 8 characters',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isRTL
          ? 'كلمتا المرور غير متطابقتين'
          : 'Passwords do not match',
      );
      return;
    }

    setLoading(true);
    try {
      const { error: supaError } = await supabase.auth.updateUser({
        password,
      });

      if (supaError) {
        setError(supaError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title={isRTL ? 'تم تغيير كلمة المرور' : 'Password Reset Successful'}
        subtitle=""
        mascotMood="celebrating"
      >
        <div className="text-center py-4 space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 text-success-600"
          >
            <CheckCircle2 size={32} />
          </motion.div>
          <p className="text-muted leading-relaxed">
            {isRTL
              ? 'تم تحديث كلمة المرور الخاصة بك بنجاح! جاري تحويلك لصفحة تسجيل الدخول...'
              : 'Your password has been reset successfully! Redirecting to login...'}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {isRTL ? 'تسجيل الدخول الآن' : 'Login now'}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isRTL ? 'تعيين كلمة مرور جديدة' : 'Reset New Password'}
      subtitle={isRTL ? 'أدخل كلمة المرور الجديدة لحسابك' : 'Enter your new password below'}
      mascotMood="thinking"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <Input
          type="password"
          name="password"
          label={t('auth.field.password')}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={18} />}
          autoComplete="new-password"
          dir="ltr"
        />

        <Input
          type="password"
          name="confirmPassword"
          label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock size={18} />}
          autoComplete="new-password"
          dir="ltr"
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {isRTL ? 'حفظ كلمة المرور الجديدة' : 'Update Password'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {isRTL ? 'العودة لتسجيل الدخول' : 'Back to login'}
        </Link>
      </div>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
