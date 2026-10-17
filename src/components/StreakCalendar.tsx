import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Flame, Snowflake } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toPersianDigits } from '@/lib/utils';

interface StreakDay {
  date: Date;
  studied: boolean;
  usedFreeze: boolean;
  isToday: boolean;
}

interface StreakCalendarProps {
  streakData: StreakDay[];
}

export function StreakCalendar({ streakData }: StreakCalendarProps) {
  const { t } = useTranslation();
  const { profile } = useAuthStore();

  const streakCount = profile?.streak_count ?? 0;
  const freezeCount = profile?.streak_freeze_count ?? 0;

  const dayLabelKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  // Show last 7 days (including today as last)
  const week = streakData.slice(-7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-error-500 to-error-600 p-5 shadow-lg shadow-error-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame size={28} className="fill-current" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold leading-none">{toPersianDigits(streakCount)}</p>
            <p className="text-xs text-white/80">{t('streak.days')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-white">
          <Snowflake size={16} />
          <span className="text-sm font-bold">{toPersianDigits(freezeCount)}</span>
          <span className="text-xs text-white/80">{t('streak.freezeAvailable')}</span>
        </div>
      </div>

      {/* Weekly calendar */}
      <div className="flex justify-between gap-1">
        {week.map((day, idx) => {
          const dayLabel = t(`streak.dayLabels.${dayLabelKeys[day.date.getDay()]}`);
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
              <span className="text-[10px] font-medium text-white/70">{dayLabel}</span>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
                  day.studied
                    ? 'bg-white text-error-500 shadow-md'
                    : day.usedFreeze
                      ? 'bg-white/30 text-white'
                      : day.isToday
                        ? 'border-2 border-white/60 bg-white/10 text-white'
                        : 'bg-white/10 text-white/40',
                ].join(' ')}
              >
                {day.studied ? (
                  <Flame size={18} className="fill-current" />
                ) : day.usedFreeze ? (
                  <Snowflake size={16} />
                ) : (
                  <span className="text-xs font-bold">{toPersianDigits(day.date.getDate())}</span>
                )}
              </motion.div>
              {day.isToday && (
                <span className="text-[10px] font-bold text-white">
                  {t('streak.today')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Motivational message */}
      <p className="mt-4 text-center text-sm text-white/90 font-medium">
        {streakCount > 0 ? t('streak.keepGoing') : t('streak.dontBreak')}
      </p>
    </motion.div>
  );
}

export default StreakCalendar;
