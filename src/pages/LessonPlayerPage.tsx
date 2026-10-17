import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Check, Star, Clock, Dumbbell, Gem, Flame, Snowflake, RotateCcw } from 'lucide-react';
import { useLessonStore } from '@/stores/lessonStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { Mascot } from '@/components/Mascot';
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer';
import { Progress } from '@/components/ui/Progress';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { formatNumber } from '@/lib/utils';
import { getCorrectAnswerText } from '@/lib/exercise';
import { AchievementToast, type AchievementUnlock } from '@/components/AchievementToast';

interface CompleteLessonResult {
  xp_awarded: number;
  gem_reward: number;
  streak_extended: boolean;
  freeze_used: boolean;
  booster_active: boolean;
  new_achievements: AchievementUnlock[] | null;
  streak_count: number;
}

export function LessonPlayerPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useUIStore();
  const isRTL = language === 'ar';
  const { profile, fetchProfile } = useAuthStore();
  const {
    exercises,
    currentIndex,
    selectedAnswer,
    answerStatus,
    hearts,
    xpEarned,
    correctCount,
    loading,
    completed,
    error,
    startLesson,
    submitAnswer,
    checkAnswer,
    nextExercise,
    reset,
  } = useLessonStore();

  const [lessonTitles, setLessonTitles] = useState<{ ar: string; en: string } | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [awardError, setAwardError] = useState(false);
  const [showOutOfHearts, setShowOutOfHearts] = useState(false);
  const [refilling, setRefilling] = useState(false);
  const [refillError, setRefillError] = useState(false);
  const [completedData, setCompletedData] = useState<CompleteLessonResult | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const completedCalledRef = useRef<string | null>(null);

  // 1.1 Verify accessibility and start lesson
  useEffect(() => {
    if (!lessonId) return;

    let isSubscribed = true;

    (async () => {
      // Fetch lesson details
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, unit_id, sort_order, is_locked, title_ar, title_en')
        .eq('id', lessonId)
        .maybeSingle();

      if (!isSubscribed) return;

      if (lessonError || !lesson || lesson.is_locked) {
        navigate('/learn', { replace: true });
        return;
      }

      // Fetch unit details
      const { data: unit } = await supabase
        .from('units')
        .select('id, stage_id, sort_order, is_locked')
        .eq('id', lesson.unit_id)
        .maybeSingle();

      if (!isSubscribed) return;

      if (!unit || unit.is_locked) {
        navigate('/learn', { replace: true });
        return;
      }

      // Fetch user progress to check accessibility
      const user = useAuthStore.getState().user;
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('lesson_id, status')
        .eq('user_id', user.id);

      if (!isSubscribed) return;

      const pMap = new Map<string, string>();
      (userProgress ?? []).forEach((p) => {
        pMap.set(p.lesson_id, p.status);
      });

      const currentStatus = pMap.get(lesson.id);
      let isAccessible = currentStatus === 'completed' || currentStatus === 'in_progress';

      if (!isAccessible) {
        // Fetch all lessons in this unit
        const { data: unitLessons } = await supabase
          .from('lessons')
          .select('id, sort_order')
          .eq('unit_id', unit.id)
          .order('sort_order', { ascending: true });

        if (!isSubscribed) return;

        const lessonsInUnit = unitLessons ?? [];
        const lessonIndex = lessonsInUnit.findIndex((l) => l.id === lesson.id);

        if (lessonIndex === 0) {
          // First lesson in unit
          if (unit.sort_order <= 1) {
            isAccessible = true;
          } else {
            // Check previous unit's last lesson
            const { data: prevUnit } = await supabase
              .from('units')
              .select('id')
              .eq('stage_id', unit.stage_id)
              .lt('sort_order', unit.sort_order)
              .order('sort_order', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!isSubscribed) return;

            if (prevUnit) {
              const { data: prevUnitLessons } = await supabase
                .from('lessons')
                .select('id')
                .eq('unit_id', prevUnit.id)
                .order('sort_order', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!isSubscribed) return;

              if (prevUnitLessons && pMap.get(prevUnitLessons.id) === 'completed') {
                isAccessible = true;
              }
            } else {
              isAccessible = true;
            }
          }
        } else if (lessonIndex > 0) {
          const prevLesson = lessonsInUnit[lessonIndex - 1];
          if (pMap.get(prevLesson.id) === 'completed') {
            isAccessible = true;
          }
        }
      }

      if (!isAccessible) {
        navigate('/learn', { replace: true });
        return;
      }

      setLessonTitles({ ar: lesson.title_ar, en: lesson.title_en });
      const initialTitle = isRTL ? lesson.title_ar : lesson.title_en;
      await startLesson(lessonId, initialTitle);
    })();

    return () => {
      isSubscribed = false;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const activeLessonTitle = lessonTitles
    ? isRTL
      ? lessonTitles.ar
      : lessonTitles.en
    : '';

  const currentExercise = exercises[currentIndex];
  const progress = exercises.length > 0
    ? Math.min(100, Math.max(0, ((currentIndex + (answerStatus !== 'idle' ? 1 : 0)) / exercises.length) * 100))
    : 0;

  // 1.3 Automatic complete_lesson invocation when completed is true
  const invokeCompleteLesson = useCallback(async () => {
    if (!lessonId || awarding) return;
    setAwarding(true);
    setAwardError(false);

    const score = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0;

    try {
      const { data, error: rpcError } = await supabase.rpc('complete_lesson', {
        p_lesson_id: lessonId,
        p_score: score,
      });

      if (rpcError) {
        console.error('complete_lesson failed:', rpcError);
        setAwardError(true);
        setAwarding(false);
        return;
      }

      const result = data as CompleteLessonResult;
      setCompletedData(result);
      await fetchProfile();
      setAwarding(false);
    } catch (err) {
      console.error('complete_lesson exception:', err);
      setAwardError(true);
      setAwarding(false);
    }
  }, [lessonId, awarding, exercises.length, correctCount, fetchProfile]);

  useEffect(() => {
    if (!completed || !lessonId) return;
    if (completedCalledRef.current === lessonId) return;

    completedCalledRef.current = lessonId;
    invokeCompleteLesson();
  }, [completed, lessonId, invokeCompleteLesson]);

  // 1.4 Immediate stop when hearts reach 0
  const handleCheck = async () => {
    const isCorrect = await checkAnswer();
    const remainingHearts = useLessonStore.getState().hearts;
    if (!isCorrect && remainingHearts <= 0) {
      setShowOutOfHearts(true);
    }
  };

  const handleContinue = () => {
    if (hearts <= 0) {
      setShowOutOfHearts(true);
      return;
    }
    nextExercise();
  };

  const handleContinueAfterComplete = () => {
    if (completedData?.new_achievements && completedData.new_achievements.length > 0 && !showAchievements) {
      setShowAchievements(true);
      return;
    }
    navigate('/learn');
  };

  // Keyboard shortcut: Enter key to check or continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (completed) {
          handleContinueAfterComplete();
        } else if (answerStatus === 'idle') {
          if (selectedAnswer !== null) {
            handleCheck();
          }
        } else {
          handleContinue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerStatus, selectedAnswer, completed, showAchievements, hearts, completedData]);

  const handleRefillHearts = async () => {
    setRefilling(true);
    setRefillError(false);
    const { data, error: rpcError } = await supabase.rpc('refill_hearts');
    if (rpcError || data === false) {
      setRefillError(true);
      setRefilling(false);
      return;
    }
    await fetchProfile();
    setRefilling(false);
    setShowOutOfHearts(false);
    navigate('/learn');
  };

  const handlePracticeToEarn = () => {
    setShowOutOfHearts(false);
    navigate('/flashcards');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  if (error === 'no_hearts' || showOutOfHearts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Mascot mood="sad" size={120} />
        </motion.div>

        <h2 className="text-2xl font-bold">{isRTL ? 'نفدت القلوب!' : 'Out of hearts!'}</h2>
        <p className="text-muted max-w-sm">
          {isRTL
            ? 'تحتاج قلوباً لمتابعة الدروس. اختر طريقة لاستعادة قلب:'
            : 'You need hearts to continue lessons. Choose a way to get a heart back:'}
        </p>

        {refillError && (
          <p className="text-sm text-error-500">
            {isRTL ? 'لا توجد جواهر كافية لإعادة التعبئة' : 'Not enough gems to refill'}
          </p>
        )}

        <div className="space-y-3 w-full max-w-sm">
          {/* Practice to earn a heart */}
          <button
            onClick={handlePracticeToEarn}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-4 py-3.5 hover:border-primary-400 transition-colors text-start"
          >
            <div className="flex items-center justify-center rounded-lg bg-primary-500 text-white shrink-0" style={{ width: 44, height: 44 }}>
              <Dumbbell size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{isRTL ? 'تدرّب لاستعادة قلب' : 'Practice to earn a heart'}</p>
              <p className="text-xs text-muted">{isRTL ? 'راجع البطاقات لاكتساب قلب' : 'Review flashcards to gain a heart'}</p>
            </div>
          </button>

          {/* Refill with gems */}
          <button
            onClick={handleRefillHearts}
            disabled={refilling || (profile?.gems ?? 0) < 50}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900/20 px-4 py-3.5 hover:border-secondary-400 transition-colors text-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center rounded-lg bg-secondary-500 text-white shrink-0" style={{ width: 44, height: 44 }}>
              <Gem size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{isRTL ? 'استخدم ٥٠ جوهرة' : 'Use 50 gems'}</p>
              <p className="text-xs text-muted">
                {isRTL
                  ? `لديك ${formatNumber(profile?.gems ?? 0, language)} جوهرة`
                  : `You have ${formatNumber(profile?.gems ?? 0, language)} gems`}
              </p>
            </div>
          </button>

          {/* Wait */}
          <button
            onClick={() => navigate('/learn')}
            className="w-full flex items-center gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-surface px-4 py-3.5 hover:border-neutral-400 transition-colors text-start"
          >
            <div className="flex items-center justify-center rounded-lg bg-neutral-400 text-white shrink-0" style={{ width: 44, height: 44 }}>
              <Clock size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{isRTL ? 'انتظر لتجديد القلوب' : 'Wait for refill'}</p>
              <p className="text-xs text-muted">{isRTL ? 'يُستعاد قلب كل ٤ ساعات تلقائياً' : '1 heart refills every 4 hours'}</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <Mascot mood="thinking" size={100} />
        <p className="text-muted">{isRTL ? 'تعذّر تحميل الدرس' : 'Could not load the lesson'}</p>
        <button
          onClick={() => navigate('/learn')}
          className="rounded-lg bg-primary-500 px-6 py-2.5 font-semibold text-white hover:bg-primary-600 transition-colors"
        >
          {isRTL ? 'العودة' : 'Go back'}
        </button>
      </div>
    );
  }

  // 1.3 Render Achievements Overlay if user triggered after completion
  if (showAchievements && completedData?.new_achievements && completedData.new_achievements.length > 0) {
    return (
      <AchievementToast
        achievements={completedData.new_achievements}
        onDismiss={() => {
          setShowAchievements(false);
          navigate('/learn');
        }}
      />
    );
  }

  // Lesson complete screen
  if (completed) {
    const accuracy = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0;
    const finalXp = completedData ? completedData.xp_awarded : xpEarned;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 py-8">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <Mascot mood="celebrating" size={140} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-1">{isRTL ? 'أحسنت!' : 'Great job!'}</h2>
          <p className="text-muted">{isRTL ? `أكملت: ${activeLessonTitle}` : `Completed: ${activeLessonTitle}`}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 w-full max-w-md"
        >
          <StatBox icon={<Star size={24} className="text-secondary-500" />} value={formatNumber(finalXp, language)} label="XP" />
          <StatBox icon={<Check size={24} className="text-success-500" />} value={formatNumber(correctCount, language)} label={isRTL ? 'صحيح' : 'Correct'} />
          <StatBox icon={<Heart size={24} className="text-rose-400" />} value={`${formatNumber(accuracy, language)}%`} label={isRTL ? 'الدقة' : 'Accuracy'} />
        </motion.div>

        {awardError && (
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
            <p className="text-sm text-error-600 dark:text-error-400 font-medium">
              {isRTL ? 'تعذّر حفظ التقدّم في الخادم' : 'Failed to save progress to server'}
            </p>
            <button
              onClick={() => {
                completedCalledRef.current = null;
                invokeCompleteLesson();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-error-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-error-700 transition-colors"
            >
              <RotateCcw size={14} />
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {/* Streak + gems info from server */}
        {completedData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            {completedData.streak_extended && (
              <div className="flex items-center gap-2 rounded-full bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 px-4 py-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Flame size={20} className="text-error-500 fill-current" />
                </motion.div>
                <span className="font-bold text-error-600 dark:text-error-400">
                  {isRTL ? `سلسلة ${formatNumber(completedData.streak_count, language)} يوم` : `${formatNumber(completedData.streak_count, language)} day streak`}
                </span>
              </div>
            )}
            {completedData.freeze_used && (
              <div className="flex items-center gap-2 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 px-4 py-2">
                <Snowflake size={18} className="text-cyan-500" />
                <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                  {isRTL ? 'تم استخدام تجميد' : 'Freeze used'}
                </span>
              </div>
            )}
            {completedData.booster_active && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2">
                <Star size={18} className="text-amber-500 fill-current" />
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {isRTL ? 'مضاعف النقاط مفعّل' : 'XP booster active'}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {completedData && completedData.gem_reward > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2"
          >
            <Gem size={20} className="text-primary-500 fill-current" />
            <span className="font-bold text-primary-600 dark:text-primary-400">
              +{formatNumber(completedData.gem_reward, language)} {isRTL ? 'جواهر' : 'gems'}
            </span>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleContinueAfterComplete}
          disabled={awarding}
          className="w-full max-w-md rounded-xl bg-success-500 px-6 py-3.5 text-lg font-bold text-white hover:bg-success-600 active:bg-success-700 disabled:opacity-50 transition-colors"
        >
          {awarding ? t('common.loading') : t('lesson.continue')}
        </motion.button>
      </div>
    );
  }

  // Main lesson screen
  return (
    <div className="max-w-2xl mx-auto px-1">
      {/* Top bar: close, progress, hearts */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setShowExitModal(true)}
          className="text-muted hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
          aria-label={isRTL ? 'الخروج من الدرس' : 'Exit lesson'}
        >
          <X size={24} />
        </button>
        <div className="flex-1">
          <Progress value={progress} size="lg" color="primary" />
        </div>
        <div className="flex items-center gap-1 text-rose-500">
          <Heart size={22} className="fill-current" />
          <span className="font-bold">{formatNumber(hearts, language)}</span>
        </div>
      </div>

      {/* Exercise area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.25 }}
          className="min-h-[300px]"
        >
          {currentExercise && (
            <ExerciseRenderer
              exercise={currentExercise}
              selectedAnswer={selectedAnswer}
              onSelect={submitAnswer}
              answerStatus={answerStatus}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback + action area */}
      <AnimatePresence>
        {answerStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={[
              'mt-6 rounded-2xl border-2 p-4',
              answerStatus === 'correct'
                ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                : 'border-error-500 bg-error-50 dark:bg-error-900/20',
            ].join(' ')}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={[
                'flex items-center justify-center rounded-full p-2',
                answerStatus === 'correct' ? 'bg-success-500' : 'bg-error-500',
              ].join(' ')}>
                {answerStatus === 'correct' ? (
                  <Check size={20} className="text-white" />
                ) : (
                  <X size={20} className="text-white" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mascot
                  mood={answerStatus === 'correct' ? 'happy' : 'sad'}
                  size={48}
                  animate={false}
                />
                <div>
                  <p className="font-bold">
                    {answerStatus === 'correct'
                      ? t('lesson.correct')
                      : t('lesson.wrong')}
                  </p>
                  {answerStatus === 'wrong' && currentExercise && (
                    <p className="text-sm text-muted">
                      {t('lesson.correctAnswer')}:{' '}
                      <span className="font-vazirmatn font-bold" dir="rtl">
                        {getCorrectAnswerText(currentExercise)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action button */}
      <div className="mt-6 pb-8">
        {answerStatus === 'idle' ? (
          <button
            onClick={handleCheck}
            disabled={selectedAnswer === null}
            className="w-full rounded-xl bg-primary-500 px-6 py-3.5 text-lg font-bold text-white hover:bg-primary-600 active:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('lesson.check')}
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className={[
              'w-full rounded-xl px-6 py-3.5 text-lg font-bold text-white transition-colors',
              answerStatus === 'correct'
                ? 'bg-success-500 hover:bg-success-600 active:bg-success-700'
                : 'bg-error-500 hover:bg-error-600 active:bg-error-700',
            ].join(' ')}
          >
            {t('lesson.continue')}
          </button>
        )}
      </div>

      {/* Exit confirmation modal */}
      <Modal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        title={isRTL ? 'مغادرة الدرس' : 'Leave lesson'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {isRTL
              ? 'هل أنت متأكد من رغبتك في مغادرة الدرس؟ ستفقد تقدّمك في هذه الجلسة.'
              : 'Are you sure you want to leave? Your progress in this session will not be saved.'}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowExitModal(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isRTL ? 'متابعة الدرس' : 'Continue'}
            </button>
            <button
              onClick={() => {
                setShowExitModal(false);
                navigate('/learn');
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-error-500 text-white hover:bg-error-600 transition-colors"
            >
              {isRTL ? 'مغادرة' : 'Leave'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl surface surface-border p-4">
      {icon}
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

export default LessonPlayerPage;
