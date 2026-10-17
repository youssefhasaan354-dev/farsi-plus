import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/utils';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth.error.emailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('auth.error.emailInvalid'));
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      // Always show success — don't reveal if the email exists
      if (supaError) {
        console.warn('Password reset request error:', supaError.message);
      }
      setSent(true);
    } catch {
      // Show neutral message regardless
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title={t('auth.forgot.title')} subtitle="" mascotMood="happy">
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30"
          >
            <CheckCircle2 size={32} className="text-success-600 dark:text-success-400" />
          </motion.div>
          <p className="text-muted leading-relaxed">{t('auth.forgot.success')}</p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {t('auth.forgot.back')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} mascotMood="thinking">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300">
            {error}
          </div>
        )}

        <Input
          type="email"
          name="email"
          label={t('auth.field.email')}
          placeholder={t('auth.field.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={18} />}
          autoComplete="email"
          dir="ltr"
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {t('auth.forgot.button')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t('auth.forgot.back')}
        </Link>
      </div>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
