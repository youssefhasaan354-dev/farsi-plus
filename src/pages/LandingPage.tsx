import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, Gamepad2, Languages, Brain, BookOpen, TrendingUp, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { Mascot } from '@/components/Mascot';
import { useAuthStore } from '@/stores/authStore';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const features = [
    { icon: GraduationCap, titleKey: 'landing.features.alphabet.title', descKey: 'landing.features.alphabet.desc' },
    { icon: Gamepad2, titleKey: 'landing.features.gamified.title', descKey: 'landing.features.gamified.desc' },
    { icon: Languages, titleKey: 'landing.features.arabicBridge.title', descKey: 'landing.features.arabicBridge.desc' },
    { icon: Brain, titleKey: 'landing.features.srs.title', descKey: 'landing.features.srs.desc' },
    { icon: BookOpen, titleKey: 'landing.features.culture.title', descKey: 'landing.features.culture.desc' },
    { icon: TrendingUp, titleKey: 'landing.features.progress.title', descKey: 'landing.features.progress.desc' },
  ];

  const steps = [
    { num: '١', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc' },
    { num: '٢', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc' },
    { num: '٣', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc' },
  ];

  const handleCta = () => navigate(user ? '/learn' : '/signup');

  return (
    <div className="min-h-dvh bg-app">
      <Header variant="public" />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pattern-girih dark:pattern-girih-dark">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-start"
            >
              {/* Persian title */}
              <h1 className="font-persian text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4 leading-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg sm:text-xl text-muted mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Button size="xl" onClick={handleCta} iconEnd={<ArrowRight size={20} className="rtl:rotate-180" />}>
                  {t('landing.hero.cta')}
                </Button>
                <div className="text-sm text-muted">
                  {t('landing.hero.haveAccount')}{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('landing.hero.login')}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Mascot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full blur-3xl" />
                <Mascot mood="happy" size={280} animate />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t('landing.features.title')}</h2>
          <p className="text-lg text-muted">{t('landing.features.subtitle')}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="surface surface-border rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2">{t(feature.titleKey)}</h3>
                <p className="text-sm text-muted leading-relaxed">{t(feature.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="bg-surface border-y border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t('landing.how.title')}</h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-500 text-white text-2xl font-bold shadow-md">
                  <span className="font-persian">{step.num}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">{t(step.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Preview mockup ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="surface surface-border rounded-2xl p-6 shadow-md"
          >
            <div className="flex h-40 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 mb-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold font-persian text-xl">آ</div>
                  <div className="h-10 w-10 rounded-full bg-primary-300 flex items-center justify-center text-white font-bold font-persian">ب</div>
                  <div className="h-8 w-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-muted font-bold font-persian">پ</div>
                </div>
                <div className="text-xs text-muted font-persian">الأبجدية الفارسية</div>
              </div>
            </div>
            <h3 className="font-bold mb-1">{t('landing.features.alphabet.title')}</h3>
            <p className="text-sm text-muted">{t('landing.features.alphabet.desc')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="surface surface-border rounded-2xl p-6 shadow-md"
          >
            <div className="flex h-40 items-center justify-center rounded-xl bg-secondary-50 dark:bg-secondary-900/20 mb-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <div className="rounded-lg bg-secondary-400 px-3 py-2 text-sm font-persian">سلام</div>
                  <div className="rounded-lg bg-neutral-200 dark:bg-neutral-700 px-3 py-2 text-sm font-persian">مرحبا</div>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-lg bg-neutral-200 dark:bg-neutral-700 px-3 py-2 text-sm font-persian">خوبی؟</div>
                  <div className="rounded-lg bg-success-400 text-white px-3 py-2 text-sm font-persian">کيف حالك؟</div>
                </div>
              </div>
            </div>
            <h3 className="font-bold mb-1">{t('landing.features.gamified.title')}</h3>
            <p className="text-sm text-muted">{t('landing.features.gamified.desc')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="surface surface-border rounded-2xl p-6 shadow-md"
          >
            <div className="flex h-40 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/20 mb-4">
              <div className="flex flex-col items-center gap-2">
                <Mascot mood="celebrating" size={80} animate={false} />
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-success-500 text-white text-xs font-bold px-3 py-1">+50 XP</div>
                  <div className="text-xs text-muted">🔥 ٧</div>
                </div>
              </div>
            </div>
            <h3 className="font-bold mb-1">{t('landing.features.progress.title')}</h3>
            <p className="text-sm text-muted">{t('landing.features.progress.desc')}</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary-500 pattern-girih-dark">
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.cta.title')}</h2>
            <p className="text-lg text-primary-100 mb-8">{t('landing.cta.subtitle')}</p>
            <div className="flex flex-col items-center gap-3">
              <Button
                size="xl"
                variant="secondary"
                onClick={handleCta}
                iconEnd={<ArrowRight size={20} className="rtl:rotate-180" />}
              >
                {t('landing.cta.button')}
              </Button>
              <div className="flex items-center gap-4 text-primary-100 text-sm">
                <span className="flex items-center gap-1.5"><Check size={16} /> {t('landing.hero.cta')}</span>
                <span className="flex items-center gap-1.5"><Check size={16} /> {t('common.skip')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;
