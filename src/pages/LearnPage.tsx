import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Flame,
  Heart,
  Gem,
  Star,
  Lock,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Trophy,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import StreakCalendar from '@/components/StreakCalendar';
import DailyQuests from '@/components/DailyQuests';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { formatNumber } from '@/lib/utils';
import { computeLessonStatus } from '@/lib/lessonStatus';
import type { Unit, Lesson } from '@/types/lesson';

interface Stage {
  id: string;
  cefr_level: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  sort_order: number;
}

interface LessonWithProgress extends Lesson {
  status: 'available' | 'in_progress' | 'completed' | 'locked';
}

export function LearnPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, profileLoading, profileError, fetchProfile } = useAuthStore();
  const { language } = useUIStore();
  const isRTL = language === 'ar';

  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState<
    { date: Date; studied: boolean; usedFreeze: boolean; isToday: boolean }[]
  >([]);

  // 1. Fetch Streak data
  const loadStreaks = useCallback(async () => {
    try {
      const { data: rpcStreak, error: rpcErr } = await supabase.rpc('get_streak_calendar');
      if (!rpcErr && Array.isArray(rpcStreak) && rpcStreak.length > 0) {
        setStreakDays(
          (
            rpcStreak as Array<{
              date: string;
              studied: boolean;
              used_freeze?: boolean;
              is_today: boolean;
            }>
          ).map((d) => ({
            date: new Date(d.date + 'T12:00:00'),
            studied: !!d.studied,
            usedFreeze: !!d.used_freeze,
            isToday: !!d.is_today,
          })),
        );
        return;
      }

      if (!user) return;

      const { data: streakData } = await supabase
        .from('streaks')
        .select('study_date, used_freeze')
        .eq('user_id', user.id)
        .order('study_date', { ascending: false })
        .limit(7);

      const streakMap = new Map<string, boolean>();
      (streakData ?? []).forEach((s) => {
        streakMap.set(s.study_date, s.used_freeze ?? false);
      });

      const today = new Date();
      const days: { date: Date; studied: boolean; usedFreeze: boolean; isToday: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        days.push({
          date: d,
          studied: streakMap.has(key),
          usedFreeze: streakMap.get(key) ?? false,
          isToday: i === 0,
        });
      }
      setStreakDays(days);
    } catch (err) {
      console.warn('Failed to load streak calendar:', err);
    }
  }, [user]);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  // 2. Fetch all stages
  const loadStages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        setQueryError(error.message);
        return;
      }

      if (data && data.length > 0) {
        setStages(data as Stage[]);
        // Select stage matching profile.cefr_level or default to first
        const matched = data.find((s) => s.cefr_level === profile?.cefr_level);
        setSelectedStageId(matched ? matched.id : data[0].id);
      }
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : 'Failed to load stages');
    }
  }, [profile?.cefr_level]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  // 3. Fetch Units, Lessons & Progress for the active Stage
  const loadStageContent = useCallback(async (stageId: string) => {
    setLoading(true);
    setQueryError(null);

    try {
      // Fetch units for this stage
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('stage_id', stageId)
        .order('sort_order', { ascending: true });

      if (unitsError) {
        setQueryError(unitsError.message);
        setLoading(false);
        return;
      }

      if (!unitsData || unitsData.length === 0) {
        setUnits([]);
        setLoading(false);
        return;
      }

      // Fetch lessons for all units in this stage
      const unitIds = unitsData.map((u) => u.id);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('unit_id', unitIds)
        .order('sort_order', { ascending: true });

      if (lessonsError) {
        setQueryError(lessonsError.message);
        setLoading(false);
        return;
      }

      // Fetch user progress scoped to user_id
      const pMap: Record<string, string> = {};
      const lessonIds = (lessonsData ?? []).map((l) => l.id);

      if (user?.id && lessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, status')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        (progressData ?? []).forEach((p) => {
          pMap[p.lesson_id] = p.status;
        });
      }

      setProgressMap(pMap);

      // Group lessons by unit
      const unitsWithLessons: Unit[] = unitsData.map((u) => ({
        ...u,
        lessons: (lessonsData ?? [])
          .filter((l) => l.unit_id === u.id)
          .map((l) => ({
            ...l,
            status: (pMap[l.id] ?? 'locked') as LessonWithProgress['status'],
          })),
      }));

      setUnits(unitsWithLessons);
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStageId) {
      loadStageContent(selectedStageId);
    }
  }, [selectedStageId, loadStageContent]);

  if (profileError && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-error-500 font-medium">
          {isRTL ? 'تعذّر تحميل الملف الشخصي' : 'Failed to load profile'}
        </p>
        <button
          onClick={() => fetchProfile()}
          className="rounded-lg bg-primary-500 px-4 py-2 text-white font-medium hover:bg-primary-600 transition-colors"
        >
          {isRTL ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (profileLoading || !profile || (loading && stages.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Spinner size="lg" />
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  const activeStage = stages.find((s) => s.id === selectedStageId);
  const activeStageTitle = activeStage
    ? isRTL
      ? activeStage.title_ar
      : activeStage.title_en
    : '';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Stats bar */}
      <div className="flex items-center justify-around rounded-xl bg-surface border border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <StatItem
          icon={<Flame size={20} className="text-error-500" />}
          value={formatNumber(profile.streak_count ?? 0, language)}
          label={t('profile.stats.streak')}
        />
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
        <StatItem
          icon={<Heart size={20} className="text-rose-400" />}
          value={formatNumber(profile.hearts ?? 0, language)}
          label={t('profile.stats.hearts')}
        />
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
        <button
          onClick={() => navigate('/shop')}
          className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-1">
            <Gem size={20} className="text-primary-500" />
            <span className="font-bold text-sm">
              {formatNumber(profile.gems ?? 0, language)}
            </span>
          </div>
          <span className="text-xs text-muted">{t('profile.stats.gems')}</span>
        </button>
        <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
        <StatItem
          icon={<Star size={20} className="text-secondary-500" />}
          value={formatNumber(profile.total_xp ?? 0, language)}
          label={t('profile.stats.xp')}
        />
      </div>

      {/* Streak calendar */}
      <StreakCalendar streakData={streakDays} />

      {/* Daily quests */}
      <DailyQuests />

      {/* Quick links to shop & achievements */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface p-4 hover:shadow-md transition-all text-start"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <p className="font-bold text-sm">{t('shop.title')}</p>
            <p className="text-xs text-muted">
              {formatNumber(profile.gems ?? 0, language)} {t('shop.gems')}
            </p>
          </div>
        </button>
        <button
          onClick={() => navigate('/achievements')}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-surface p-4 hover:shadow-md transition-all text-start"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <p className="font-bold text-sm">{t('achievements.title')}</p>
            <p className="text-xs text-muted">{t('achievements.subtitle')}</p>
          </div>
        </button>
      </div>

      {/* Stage Selector Tabs */}
      {stages.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
          {stages.map((stg) => {
            const isSelected = stg.id === selectedStageId;
            return (
              <button
                key={stg.id}
                onClick={() => setSelectedStageId(stg.id)}
                className={[
                  'rounded-xl px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                  isSelected
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-surface border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-muted',
                ].join(' ')}
              >
                {stg.cefr_level} — {isRTL ? stg.title_ar : stg.title_en}
              </button>
            );
          })}
        </div>
      )}

      {/* Stage Header */}
      <div className="text-center">
        {activeStage && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/20 px-4 py-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
            <BookOpen size={16} />
            {activeStage.cefr_level}
          </div>
        )}
        <h1 className="text-2xl font-bold">{activeStageTitle}</h1>
        {activeStage && (
          <p className="text-sm text-muted mt-1">
            {isRTL
              ? activeStage.description_ar ?? 'تعلّم الفارسية خطوة بخطوة'
              : activeStage.description_en ?? 'Learn Persian step by step'}
          </p>
        )}
      </div>

      {/* Error state */}
      {queryError && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <p className="text-sm">{queryError}</p>
          </div>
          <button
            onClick={() => selectedStageId && loadStageContent(selectedStageId)}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <RefreshCw size={14} />
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Units as a vertical path */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : units.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-surface/50 text-center p-6">
            <BookOpen size={40} className="text-neutral-400" />
            <h3 className="font-bold text-lg">
              {isRTL ? 'محتوى هذه المرحلة قادم قريباً' : 'Content for this stage is coming soon'}
            </h3>
            <p className="text-muted text-sm max-w-sm">
              {isRTL
                ? 'يعمل فريقنا على إعداد ومراجعة دروس هذه المرحلة لتقديم أفضل تجربة تعليمية.'
                : 'Our team is working on preparing lessons for this stage.'}
            </p>
          </div>
        ) : (
          units.map((unit, unitIdx) => {
            const prevUnit = unitIdx > 0 ? units[unitIdx - 1] : null;
            const prevUnitLessons = prevUnit?.lessons ?? [];
            const prevUnitLastLesson =
              prevUnitLessons.length > 0 ? prevUnitLessons[prevUnitLessons.length - 1] : null;
            const prevUnitCompleted = prevUnitLastLesson
              ? progressMap[prevUnitLastLesson.id] === 'completed'
              : true;
            const currentUnitStarted = (unit.lessons ?? []).some(
              (l) => progressMap[l.id] === 'completed' || progressMap[l.id] === 'in_progress',
            );
            const isUnitUnlocked =
              !unit.is_locked && (unitIdx === 0 || prevUnitCompleted || currentUnitStarted);

            return (
              <UnitSection
                key={unit.id}
                unit={unit}
                unitNumber={unitIdx + 1}
                isRTL={isRTL}
                language={language}
                isUnitUnlocked={isUnitUnlocked}
                progressMap={progressMap}
                onLessonClick={(lessonId) => navigate(`/lesson/${lessonId}`)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function UnitSection({
  unit,
  unitNumber,
  isRTL,
  language,
  isUnitUnlocked,
  progressMap,
  onLessonClick,
}: {
  unit: Unit;
  unitNumber: number;
  isRTL: boolean;
  language: string;
  isUnitUnlocked: boolean;
  progressMap: Record<string, string>;
  onLessonClick: (lessonId: string) => void;
}) {
  const title = isRTL ? unit.title_ar : unit.title_en;
  const desc = isRTL ? unit.description_ar : unit.description_en;
  const lessons = unit.lessons ?? [];

  const unitLocked = unit.is_locked || !isUnitUnlocked;

  return (
    <div className="relative">
      {/* Unit header */}
      <Card padding="md" className="mb-4">
        <div className="flex items-start gap-3">
          <div
            className={[
              'flex items-center justify-center rounded-xl shrink-0',
              unitLocked ? 'bg-neutral-200 dark:bg-neutral-700' : 'bg-primary-500',
            ].join(' ')}
            style={{ width: 44, height: 44 }}
          >
            {unitLocked ? (
              <Lock size={20} className="text-neutral-500" />
            ) : (
              <span className="text-white font-bold text-lg">
                {formatNumber(unitNumber, language)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold">{title}</h3>
            {desc && <p className="text-sm text-muted mt-0.5">{desc}</p>}
          </div>
        </div>
      </Card>

      {/* Unit empty lessons "Coming Soon" */}
      {lessons.length === 0 && !unitLocked && (
        <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center text-sm text-muted bg-surface/50">
          {isRTL ? 'دروس هذه الوحدة قادمة قريباً' : 'Lessons for this unit are coming soon'}
        </div>
      )}

      {/* Lessons path */}
      {!unitLocked && lessons.length > 0 && (
        <div className="relative space-y-3">
          {lessons.map((lesson, lessonIdx) => {
            const prevLessonId = lessonIdx > 0 ? lessons[lessonIdx - 1].id : null;
            const prevCompleted = prevLessonId ? progressMap[prevLessonId] === 'completed' : true;
            const effectiveStatus = computeLessonStatus({
              isLessonLockedByDb: lesson.is_locked,
              lessonIndex: lessonIdx,
              prevLessonCompleted: prevCompleted,
              userProgressStatus: progressMap[lesson.id],
            });

            return (
              <LessonNode
                key={lesson.id}
                lesson={lesson}
                status={effectiveStatus}
                isRTL={isRTL}
                language={language}
                onClick={() => {
                  if (effectiveStatus !== 'locked') {
                    onLessonClick(lesson.id);
                  }
                }}
                offsetClass={lessonIdx % 2 === 0 ? 'ms-0' : 'ms-12'}
              />
            );
          })}
        </div>
      )}

      {unitLocked && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted">
          <Lock size={18} />
          <span className="text-sm">
            {isRTL ? 'أكمل الوحدة السابقة لفتح هذه الوحدة' : 'Complete the previous unit to unlock'}
          </span>
        </div>
      )}
    </div>
  );
}

function LessonNode({
  lesson,
  status,
  isRTL,
  language,
  onClick,
  offsetClass,
}: {
  lesson: Lesson;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  isRTL: boolean;
  language: string;
  onClick: () => void;
  offsetClass: string;
}) {
  const title = isRTL ? lesson.title_ar : lesson.title_en;

  const icon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={28} className="text-white" />;
      case 'in_progress':
      case 'available':
        return <PlayCircle size={28} className="text-white" />;
      case 'locked':
        return <Lock size={24} className="text-neutral-400" />;
    }
  };

  const bgClass = () => {
    switch (status) {
      case 'completed':
        return 'bg-success-500 shadow-lg shadow-success-500/30';
      case 'in_progress':
        return 'bg-amber-500 shadow-lg shadow-amber-500/30';
      case 'available':
        return 'bg-primary-500 shadow-lg shadow-primary-500/30';
      case 'locked':
        return 'bg-neutral-200 dark:bg-neutral-700';
    }
  };

  const statusLabel = () => {
    switch (status) {
      case 'completed':
        return isRTL ? 'مكتمل' : 'Completed';
      case 'in_progress':
        return isRTL ? 'متابعة الدرس' : 'Continue';
      case 'available':
        return isRTL ? 'ابدأ الدرس' : 'Start lesson';
      case 'locked':
        return isRTL ? 'مقفل' : 'Locked';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={[offsetClass].join(' ')}
    >
      <button
        onClick={onClick}
        disabled={status === 'locked'}
        className={[
          'flex items-center gap-3 w-full max-w-sm rounded-xl surface surface-border p-3 transition-all',
          status === 'locked' ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer',
          status === 'available' ? 'ring-2 ring-primary-500/50' : '',
        ].join(' ')}
      >
        <div
          className={[
            'flex items-center justify-center rounded-full shrink-0',
            bgClass(),
            status === 'available' ? 'animate-pulse' : '',
          ].join(' ')}
          style={{ width: 52, height: 52 }}
        >
          {icon()}
        </div>
        <div className="flex-1 text-start min-w-0">
          <p className="font-semibold truncate">{title}</p>
          <p className="text-xs text-muted">
            {statusLabel()}
            {' · '}
            {formatNumber(lesson.xp_reward, language)} XP
          </p>
        </div>
      </button>
    </motion.div>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-bold text-sm">{value}</span>
      </div>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export default LearnPage;
