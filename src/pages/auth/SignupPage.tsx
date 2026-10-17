import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/layout/AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { isValidEmail, passwordStrength } from '@/lib/utils';

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const strengthColors = ['bg-error-500', 'bg-warning-500', 'bg-primary-500', 'bg-success-500'];

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = t('auth.error.nameRequired');
    if (!email) e.email = t('auth.error.emailRequired');
    else if (!isValidEmail(email)) e.email = t('auth.error.emailInvalid');
    if (!password) e.password = t('auth.error.passwordRequired');
    else if (password.length < 8) e.password = t('auth.error.passwordShort');
    if (password !== confirmPassword) e.confirmPassword = t('auth.error.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAuthError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) throw error;

      if (data.session) {
        await fetchProfile();
        navigate('/onboarding', { replace: true });
      } else {
        // Email confirmation is enabled — redirect to login with confirmation alert and email
        navigate('/login', { replace: true, state: { signedUp: true, email } });
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string; status?: number } | null;
      const code = authErr?.code ?? '';
      const msg = authErr?.message ?? '';
      if (code === 'user_already_exists' || authErr?.status === 422 || msg.includes('already registered')) {
        setAuthError(t('auth.error.signupFailed'));
      } else if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
        setAuthError(t('auth.error.network'));
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
    <AuthLayout title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')} mascotMood="happy">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-3 text-sm text-error-700 dark:text-error-300"
          >
            {authError}
          </motion.div>
        )}

        <Input
          type="text"
          name="name"
          label={t('auth.field.name')}
          placeholder={t('auth.field.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={<UserIcon size={18} />}
          autoComplete="name"
        />

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

        <div>
          <Input
            type="password"
            name="password"
            label={t('auth.field.password')}
            placeholder={t('auth.field.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock size={18} />}
            autoComplete="new-password"
            dir="ltr"
          />
          {password && (
            <div className="mt-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < strength ? strengthColors[strength - 1] : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <Input
          type="password"
          name="confirmPassword"
          label={t('auth.field.confirmPassword')}
          placeholder={t('auth.field.passwordPlaceholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          icon={<Lock size={18} />}
          autoComplete="new-password"
          dir="ltr"
        />

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {t('auth.button.signup')}
        </Button>

        <p className="text-center text-sm text-muted pt-2">
          {t('auth.button.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            {t('auth.button.loginNow')}
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

export default SignupPage;
