import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, GraduationCap, Briefcase, Palette, BookHeart, Check } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

type Step = 'goal' | 'time' | 'level';

const goals = [
  { key: 'travel', icon: Plane },
  { key: 'study', icon: GraduationCap },
  { key: 'work', icon: Briefcase },
  { key: 'culture', icon: Palette },
  { key: 'poetry', icon: BookHeart },
];

const times = [5, 10, 15, 30, 60];

const levels = [
  { key: 'A0', labelKey: 'onboarding.level.beginner' },
  { key: 'A1', labelKey: 'onboarding.level.elementary' },
  { key: 'A2', labelKey: 'onboarding.level.intermediate' },
  { key: 'B1', labelKey: 'onboarding.level.advanced' },
];

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();

  const [step, setStep] = useState<Step>('goal');
  const [goal, setGoal] = useState<string>('');
  const [time, setTime] = useState<number>(15);
  const [level, setLevel] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user) {
      navigate('/learn');
      return;
    }

    setSaving(true);
    try {
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';

      const { error } = await supabase
        .from('profiles')
        .update({
          learning_goal: goal || null,
          daily_goal_minutes: time,
          daily_goal_xp: time * 5,
          cefr_level: level || 'A0',
          timezone: userTz,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Onboarding update error:', error.message);
      }

      await fetchProfile();
      navigate('/learn', { replace: true });
    } catch (err) {
      console.error('Onboarding save failed:', err);
      navigate('/learn', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = step === 'goal' ? !!goal : step === 'time' ? true : true;
  const stepOrder: Step[] = ['goal', 'time', 'level'];
  const stepIndex = stepOrder.indexOf(step);

  return (
    <div className="min-h-dvh bg-app flex flex-col items-center justify-center px-4 py-8">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {stepOrder.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= stepIndex ? 'w-8 bg-primary-500' : 'w-2 bg-neutral-300 dark:bg-neutral-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'goal' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <Mascot mood="happy" size={80} className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{t('onboarding.goal.title')}</h1>
              <p className="text-muted">{t('onboarding.goal.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {goals.map((g) => {
                const Icon = g.icon;
                const selected = goal === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => setGoal(g.key)}
                    className={[
                      'flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200',
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-105'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300',
                    ].join(' ')}
                  >
                    <Icon size={28} className={selected ? 'text-primary-600 dark:text-primary-400' : 'text-muted'} />
                    <span className="text-sm font-semibold">{t(`onboarding.goal.${g.key}`)}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                disabled={!canProceed}
                onClick={() => setStep('time')}
                iconEnd={<Check size={20} />}
              >
                {t('onboarding.button.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'time' && (
          <motion.div
            key="time"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <Mascot mood="thinking" size={80} className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{t('onboarding.time.title')}</h1>
              <p className="text-muted">{t('onboarding.time.subtitle')}</p>
            </div>

            <div className="space-y-2 mb-8">
              {times.map((tm) => {
                const selected = time === tm;
                return (
                  <button
                    key={tm}
                    onClick={() => setTime(tm)}
                    className={[
                      'flex w-full items-center justify-between rounded-xl border-2 px-5 py-4 transition-all duration-200',
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300',
                    ].join(' ')}
                  >
                    <span className="font-semibold">{t(`onboarding.time.${tm}`)}</span>
                    <div
                      className={[
                        'h-5 w-5 rounded-full border-2 transition-colors',
                        selected ? 'border-primary-500 bg-primary-500' : 'border-neutral-300',
                      ].join(' ')}
                    >
                      {selected && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep('goal')}>
                {t('onboarding.button.back')}
              </Button>
              <Button size="lg" onClick={() => setStep('level')} iconEnd={<Check size={20} />}>
                {t('onboarding.button.next')}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'level' && (
          <motion.div
            key="level"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <Mascot mood="encouraging" size={80} className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{t('onboarding.level.title')}</h1>
              <p className="text-muted">{t('onboarding.level.subtitle')}</p>
            </div>

            <div className="space-y-2 mb-8">
              {levels.map((lv) => {
                const selected = level === lv.key;
                return (
                  <button
                    key={lv.key}
                    onClick={() => setLevel(lv.key)}
                    className={[
                      'flex w-full items-center justify-between rounded-xl border-2 px-5 py-4 transition-all duration-200',
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300',
                    ].join(' ')}
                  >
                    <span className="font-semibold">{t(lv.labelKey)}</span>
                    <span className="text-xs font-bold text-muted">{lv.key}</span>
                  </button>
                );
              })}

              <button
                onClick={() => setLevel('A0')}
                className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 px-5 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              >
                {t('onboarding.level.skip')}
              </button>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" size="lg" onClick={() => setStep('time')}>
                {t('onboarding.button.back')}
              </Button>
              <Button size="lg" variant="success" loading={saving} onClick={handleFinish}>
                {t('onboarding.button.finish')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OnboardingPage;
