import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Gift, Zap, Target, Star } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';

interface DailyQuest {
  id: string;
  quest_type: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  gem_reward: number;
  is_completed: boolean;
  reward_claimed: boolean;
}

export function DailyQuests() {
  const { t } = useTranslation();
  const { language } = useUIStore();
  const isRTL = language === 'ar';
  const { fetchProfile } = useAuthStore();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(false);
  const [rewardData, setRewardData] = useState<{ gems: number; xp: number } | null>(null);

  const loadQuests = useCallback(async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    // Ensure today's quests are generated
    try {
      await supabase.rpc('generate_daily_quests');
    } catch {
      // Non-blocking
    }

    // Today in user timezone
    const profile = useAuthStore.getState().profile;
    const tz = profile?.timezone || 'Africa/Cairo';
    let todayStr: string;
    try {
      todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
    } catch {
      todayStr = new Date().toISOString().split('T')[0];
    }

    const { data } = await supabase
      .from('daily_quests')
      .select('id, quest_type, target_value, current_value, xp_reward, gem_reward, is_completed, reward_claimed')
      .eq('user_id', user.id)
      .eq('quest_date', todayStr)
      .order('quest_type');

    if (data) {
      setQuests(data as DailyQuest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQuests();

    // Refresh quests on focus or visibility change (e.g. if midnight passed while tab was open)
    const onFocus = () => {
      loadQuests();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadQuests]);

  const allCompleted = quests.length > 0 && quests.every((q) => q.is_completed);
  const rewardClaimed = quests.length > 0 && quests.every((q) => q.reward_claimed);

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError(false);
    const { data, error } = await supabase.rpc('claim_daily_quest_reward');

    if (error || !data) {
      setClaimError(true);
      setClaiming(false);
      return;
    }

    const result = data as { gems_earned?: number; xp_earned?: number; success?: boolean };
    setRewardData({ gems: result.gems_earned ?? 0, xp: result.xp_earned ?? 0 });
    await fetchProfile();
    await loadQuests();
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-surface p-5">
        <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-surface p-5 text-center">
        <Target size={24} className="mx-auto mb-2 text-neutral-300" />
        <p className="text-sm text-muted">{t('quests.subtitle')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-surface p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary-500" />
          <div>
            <h3 className="font-bold">{t('quests.title')}</h3>
            <p className="text-xs text-muted">{t('quests.subtitle')}</p>
          </div>
        </div>
        <span className="text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1">
          {formatNumber(quests.filter((q) => q.is_completed).length, language)} / {formatNumber(quests.length, language)}
        </span>
      </div>

      {/* Quest list */}
      <div className="space-y-2.5">
        {quests.map((quest, idx) => {
          const progress = Math.min((quest.current_value / quest.target_value) * 100, 100);
          const questLabel = t(`quests.type.${quest.quest_type}`);

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={[
                'flex items-center gap-3 rounded-xl p-3 transition-colors',
                quest.is_completed
                  ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                  : 'bg-neutral-50 dark:bg-neutral-800/50',
              ].join(' ')}
            >
              <div className={[
                'flex h-10 w-10 items-center justify-center rounded-xl shrink-0',
                quest.is_completed
                  ? 'bg-success-500 text-white'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
              ].join(' ')}>
                {quest.is_completed ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <QuestTypeIcon type={quest.quest_type} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">{questLabel}</p>
                  <span className="text-xs font-bold text-muted shrink-0">
                    {formatNumber(Math.min(quest.current_value, quest.target_value), language)} / {formatNumber(quest.target_value, language)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <motion.div
                    className={[
                      'h-full rounded-full',
                      quest.is_completed ? 'bg-success-500' : 'bg-primary-500',
                    ].join(' ')}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Reward indicators */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {quest.xp_reward > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-secondary-500">
                    <Star size={12} className="fill-current" />
                    {formatNumber(quest.xp_reward, language)}
                  </span>
                )}
                {quest.gem_reward > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-primary-500">
                    <GemIcon />
                    {formatNumber(quest.gem_reward, language)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Claim reward button */}
      {allCompleted && !rewardClaimed && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleClaim}
          disabled={claiming}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-3 font-bold text-white hover:bg-secondary-600 transition-colors disabled:opacity-50"
        >
          <Gift size={20} />
          {claiming ? t('common.loading') : t('quests.claimReward')}
        </motion.button>
      )}

      {rewardClaimed && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 px-4 py-3 text-success-600 dark:text-success-400 font-semibold text-sm">
          <CheckCircle2 size={18} />
          {t('quests.rewardClaimed')}
        </div>
      )}

      {claimError && (
        <p className="mt-3 text-center text-sm text-error-500">{t('quests.claimError')}</p>
      )}

      {/* Reward popup */}
      <AnimatePresence>
        {rewardData && (
          <motion.div
            className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRewardData(null)}
          >
            <motion.div
              className="w-full max-w-xs rounded-3xl bg-surface p-8 text-center shadow-2xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <motion.div
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary-500 text-white shadow-lg"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Gift size={36} />
              </motion.div>
              <h3 className="text-lg font-bold mb-1">{t('quests.allComplete')}</h3>
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1 rounded-full bg-secondary-50 dark:bg-secondary-900/20 px-4 py-2 font-bold text-secondary-600">
                  <Star size={18} className="fill-current" />
                  {formatNumber(rewardData.xp, language)}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/20 px-4 py-2 font-bold text-primary-600">
                  <GemIcon />
                  {formatNumber(rewardData.gems, language)}
                </span>
              </div>
              <button
                onClick={() => setRewardData(null)}
                className="mt-6 w-full rounded-xl bg-primary-500 px-4 py-3 font-bold text-white hover:bg-primary-600 transition-colors"
              >
                {t('common.continue')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QuestTypeIcon({ type }: { type: string }) {
  if (type === 'earn_xp') return <Zap size={20} />;
  if (type === 'perfect_lesson') return <Star size={20} />;
  return <Target size={20} />;
}

function GemIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
    </svg>
  );
}

export default DailyQuests;
