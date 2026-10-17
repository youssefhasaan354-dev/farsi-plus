import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Star, Gem } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useIsRTL } from '@/lib/useIsRTL';

export interface AchievementUnlock {
  code: string;
  title_en: string;
  title_ar: string;
  icon: string;
  xp_reward: number;
  gem_reward: number;
}

interface AchievementToastProps {
  achievements: AchievementUnlock[];
  onDismiss: () => void;
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {achievements.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('achievements.newUnlock')}
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600 p-8 text-center shadow-2xl overflow-hidden"
            initial={shouldReduceMotion ? undefined : { scale: 0.5, opacity: 0, y: 30 }}
            animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { scale: 0.5, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle decorations */}
            {!shouldReduceMotion && (
              <>
                <motion.div
                  className="absolute top-4 right-4 text-white/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={28} />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 left-4 text-white/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={20} />
                </motion.div>
              </>
            )}

            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                {t('achievements.newUnlock')}
              </p>

              {achievements.map((ach) => (
                <div key={ach.code} className="mb-4 last:mb-0">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-4 ring-white/30">
                    <AchievementIcon name={ach.icon} size={36} className="text-white" />
                  </div>
                  <p className="text-lg font-bold text-white">
                    {isRTL ? ach.title_ar : ach.title_en}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3 text-white/90">
                    {ach.xp_reward > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                        <Star size={14} className="fill-current" />
                        {formatNumber(ach.xp_reward, i18n.language)}
                      </span>
                    )}
                    {ach.gem_reward > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                        <Gem size={14} className="fill-current" />
                        {formatNumber(ach.gem_reward, i18n.language)}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={onDismiss}
                className="mt-4 w-full rounded-xl bg-white px-6 py-3 font-bold text-secondary-600 hover:bg-white/90 transition-colors"
              >
                {t('common.continue')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function AchievementIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  const IconComp = (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? LucideIcons.Award;
  return <IconComp size={size} className={className} />;
}

export default AchievementToast;
