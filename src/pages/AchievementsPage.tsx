import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Gem, Lock, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toPersianDigits } from '@/lib/utils';
import { AchievementIcon } from '@/components/AchievementToast';

interface Achievement {
  id: string;
  code: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  xp_reward: number;
  gem_reward: number;
  sort_order: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

export function AchievementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useUIStore();
  const isRTL = language === 'ar';
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedMap, setEarnedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: achData } = await supabase
        .from('achievements')
        .select('id, code, title_en, title_ar, description_en, description_ar, icon, xp_reward, gem_reward, sort_order')
        .order('sort_order');

      if (achData) setAchievements(achData as Achievement[]);

      if (user) {
        const { data: earnedData } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id);

        if (earnedData) {
          const map: Record<string, string> = {};
          (earnedData as UserAchievement[]).forEach((e) => {
            map[e.achievement_id] = e.earned_at;
          });
          setEarnedMap(map);
        }
      }

      setLoading(false);
    })();
  }, [user]);

  const unlockedCount = Object.keys(earnedMap).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-500 border-t-transparent" />
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/learn')}
          className="rounded-lg p-2 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isRTL ? <ArrowLeft size={22} className="rotate-180" /> : <ArrowLeft size={22} />}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t('achievements.title')}</h1>
          <p className="text-sm text-muted">{t('achievements.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-secondary-500">{toPersianDigits(unlockedCount)}</span>
          <span className="text-xs text-muted">/ {toPersianDigits(achievements.length)}</span>
        </div>
      </div>

      {/* Progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 p-5 text-white"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold">{t('achievements.unlockedCount')}</span>
          <span className="text-sm font-bold">
            {toPersianDigits(Math.round((unlockedCount / Math.max(achievements.length, 1)) * 100))}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / Math.max(achievements.length, 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {achievements.map((ach, idx) => {
          const isUnlocked = !!earnedMap[ach.id];
          const name = isRTL ? ach.title_ar : ach.title_en;
          const desc = isRTL ? ach.description_ar : ach.description_en;

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className={[
                'relative rounded-2xl border p-4 flex flex-col items-center text-center transition-all',
                isUnlocked
                  ? 'border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/20'
                  : 'border-neutral-200 dark:border-neutral-700 bg-surface opacity-70',
              ].join(' ')}
            >
              {/* Lock badge */}
              {!isUnlocked && (
                <div className="absolute top-2 end-2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <Lock size={14} className="text-neutral-400" />
                </div>
              )}
              {isUnlocked && (
                <div className="absolute top-2 end-2 flex h-7 w-7 items-center justify-center rounded-full bg-success-500">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={[
                'mb-3 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all',
                isUnlocked
                  ? 'bg-secondary-500 text-white shadow-secondary-500/30'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500',
              ].join(' ')}>
                <AchievementIcon name={ach.icon} size={28} />
              </div>

              <h3 className="font-bold text-sm mb-1">{name}</h3>
              <p className="text-xs text-muted mb-3 flex-1">{desc}</p>

              {/* Rewards */}
              <div className="flex items-center gap-2">
                {ach.xp_reward > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-secondary-500">
                    <Star size={12} className="fill-current" />
                    {toPersianDigits(ach.xp_reward)}
                  </span>
                )}
                {ach.gem_reward > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-primary-500">
                    <Gem size={12} className="fill-current" />
                    {toPersianDigits(ach.gem_reward)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default AchievementsPage;
