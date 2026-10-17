import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw,
  Volume2,
  Heart,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useIsRTL } from '@/lib/useIsRTL';
import { Mascot } from '@/components/Mascot';
import { Spinner } from '@/components/ui/Spinner';

interface Flashcard {
  vocabulary_id: string;
  persian_script: string;
  arabic_meaning: string;
  latin_transliteration?: string | null;
  audio_url?: string | null;
  part_of_speech?: string | null;
  sm2_interval: number;
  sm2_repetitions: number;
  is_due: boolean;
}

export function FlashcardsPage() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const navigate = useNavigate();
  const { profile, fetchProfile } = useAuthStore();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [heartAwarded, setHeartAwarded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setSessionCompleted(false);
    setHeartAwarded(false);

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_due_flashcards', {
        p_limit: 15,
      });

      if (rpcErr) {
        // Fallback to direct vocabulary query if RPC isn't available yet
        const { data: vocabData, error: vocabErr } = await supabase
          .from('vocabulary')
          .select('id, persian_script, arabic_meaning, latin_transliteration, audio_url, part_of_speech')
          .limit(15);

        if (vocabErr) {
          setError(vocabErr.message);
          setLoading(false);
          return;
        }

        const mapped: Flashcard[] = (vocabData ?? []).map((v) => ({
          vocabulary_id: v.id,
          persian_script: v.persian_script,
          arabic_meaning: v.arabic_meaning,
          latin_transliteration: v.latin_transliteration,
          audio_url: v.audio_url,
          part_of_speech: v.part_of_speech,
          sm2_interval: 0,
          sm2_repetitions: 0,
          is_due: true,
        }));
        setCards(mapped);
      } else {
        setCards((data as Flashcard[]) ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const speakWord = useCallback((text: string, audioUrl?: string | null) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        speakTTS(text);
      });
      return;
    }
    speakTTS(text);
  }, []);

  const speakTTS = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleRate = async (grade: number) => {
    if (submitting || currentIndex >= cards.length) return;
    setSubmitting(true);

    const card = cards[currentIndex];

    try {
      await supabase.rpc('review_flashcard', {
        p_vocabulary_id: card.vocabulary_id,
        p_grade: grade,
      });
    } catch (err) {
      console.warn('review_flashcard RPC call error:', err);
    }

    const nextCount = reviewedCount + 1;
    setReviewedCount(nextCount);
    setIsFlipped(false);
    setSubmitting(false);

    if (currentIndex + 1 >= cards.length) {
      // Completed session
      try {
        const { data: completeData } = await supabase.rpc('complete_flashcard_session', {
          p_reviewed_count: nextCount,
        });
        if (completeData && typeof completeData === 'object' && 'heart_awarded' in (completeData as Record<string, unknown>)) {
          if ((completeData as { heart_awarded?: boolean }).heart_awarded) {
            setHeartAwarded(true);
          }
        }
        await fetchProfile();
      } catch (err) {
        console.warn('complete_flashcard_session error:', err);
      }
      setSessionCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted">
          {isRTL ? 'جارٍ تجهيز البطاقات التعليمية...' : 'Preparing flashcards...'}
        </p>
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Mascot mood="thinking" size={120} className="mx-auto" />
        <h2 className="text-xl font-bold">
          {isRTL ? 'لا توجد بطاقات للمراجعة حالياً' : 'No flashcards due for review'}
        </h2>
        <p className="text-sm text-muted">
          {isRTL
            ? 'أحسنت! راجعت جميع الكلمات المستحقة. يمكنك مواصلة التعلّم لإضافة كلمات جديدة.'
            : 'Well done! You reviewed all due cards. Continue learning lessons to discover more words.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/learn')}
            className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            {isRTL ? 'الانتقال للدروس' : 'Go to lessons'}
          </button>
          <button
            onClick={fetchCards}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw size={16} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  if (sessionCompleted) {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <Mascot mood="celebrating" size={140} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {isRTL ? 'اكتملت جلسة المراجعة!' : 'Review Session Complete!'}
          </h2>
          <p className="text-sm text-muted mt-2">
            {isRTL
              ? `راجعت بنجاح ${reviewedCount} بطاقة تعليمية بنظام التكرار المتباعد.`
              : `You successfully reviewed ${reviewedCount} cards using spaced repetition.`}
          </p>
        </motion.div>

        {/* Rewards Box */}
        <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500" size={24} />
            <span className="font-bold text-lg">+10 XP</span>
          </div>
          {heartAwarded && (
            <div className="flex items-center gap-2 text-rose-500">
              <Heart className="fill-current" size={24} />
              <span className="font-bold text-lg">
                {isRTL ? '+1 قلب مستعاد!' : '+1 Heart recovered!'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => navigate('/learn')}
            className="w-full sm:w-auto rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-600 transition-colors"
          >
            {isRTL ? 'العودة للتعلّم' : 'Back to Learn'}
          </button>
          <button
            onClick={fetchCards}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 px-6 py-3 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw size={18} />
            {isRTL ? 'مراجعة المزيد' : 'Review More'}
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.flashcards')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-rose-500">
            <Heart size={20} className="fill-current" />
            <span className="font-bold">{profile?.hearts ?? 5}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Spaced repetition card */}
      <div
        className="relative min-h-[320px] cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full min-h-[320px] rounded-3xl border-2 border-primary-200 dark:border-primary-800 bg-surface p-8 shadow-md hover:shadow-lg transition-all flex flex-col justify-between items-center text-center"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {!isFlipped ? (
            /* Front of card — Persian */
            <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4">
              <span className="text-xs uppercase tracking-wider text-muted">
                {isRTL ? 'فارسي' : 'Persian'}
              </span>
              <h2 className="font-vazirmatn text-5xl font-bold text-primary-700 dark:text-primary-300" dir="rtl">
                {currentCard.persian_script}
              </h2>
              {currentCard.latin_transliteration && (
                <p className="text-sm text-muted font-mono">
                  {currentCard.latin_transliteration}
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(currentCard.persian_script, currentCard.audio_url);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-4 py-2 text-xs font-semibold hover:bg-primary-200 transition-colors"
                aria-label={isRTL ? 'استمع للنطق' : 'Listen'}
              >
                <Volume2 size={16} />
                {isRTL ? 'استمع' : 'Listen'}
              </button>
            </div>
          ) : (
            /* Back of card — Arabic Meaning */
            <div
              className="w-full flex-1 flex flex-col items-center justify-center space-y-4"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs uppercase tracking-wider text-muted">
                {isRTL ? 'المعنى بالعربية' : 'Arabic Meaning'}
              </span>
              <h2 className="font-cairo text-3xl font-bold text-secondary-800 dark:text-secondary-200" dir="rtl">
                {currentCard.arabic_meaning}
              </h2>
              {currentCard.part_of_speech && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted">
                  {currentCard.part_of_speech}
                </span>
              )}
            </div>
          )}

          <div
            className="pt-4 text-xs text-muted flex items-center gap-1.5"
            style={isFlipped ? { transform: 'rotateY(180deg)' } : {}}
          >
            <RotateCw size={14} />
            {isRTL ? 'اضغط لقلب البطاقة' : 'Tap anywhere to flip'}
          </div>
        </motion.div>
      </div>

      {/* SM-2 Rating Buttons (shown when card is flipped) */}
      <div className="space-y-3">
        <AnimatePresence>
          {isFlipped ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="grid grid-cols-4 gap-2"
            >
              <button
                onClick={() => handleRate(1)}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3 text-rose-700 dark:text-rose-300 hover:bg-rose-100 active:scale-95 transition-all"
              >
                <span className="text-xs font-bold">{isRTL ? 'أعدها' : 'Again'}</span>
                <span className="text-[10px] text-muted mt-0.5">&lt; 1d</span>
              </button>
              <button
                onClick={() => handleRate(2)}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-700 dark:text-amber-300 hover:bg-amber-100 active:scale-95 transition-all"
              >
                <span className="text-xs font-bold">{isRTL ? 'صعب' : 'Hard'}</span>
                <span className="text-[10px] text-muted mt-0.5">1-2d</span>
              </button>
              <button
                onClick={() => handleRate(3)}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-700 dark:text-blue-300 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <span className="text-xs font-bold">{isRTL ? 'جيد' : 'Good'}</span>
                <span className="text-[10px] text-muted mt-0.5">3-4d</span>
              </button>
              <button
                onClick={() => handleRate(4)}
                disabled={submitting}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 active:scale-95 transition-all"
              >
                <span className="text-xs font-bold">{isRTL ? 'سهل' : 'Easy'}</span>
                <span className="text-[10px] text-muted mt-0.5">6d+</span>
              </button>
            </motion.div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-600 transition-colors"
              >
                {isRTL ? 'عرض الإجابة' : 'Show Answer'}
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FlashcardsPage;
