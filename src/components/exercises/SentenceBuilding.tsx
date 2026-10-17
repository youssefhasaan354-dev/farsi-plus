import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import type { SentenceBuildingData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface SentenceBuildingProps {
  data: SentenceBuildingData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
}

interface WordToken {
  id: string;
  word: string;
}

export function SentenceBuilding({
  data,
  onSelect,
  answerStatus,
}: SentenceBuildingProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';

  // Initialize tokens with stable unique IDs
  const [tokens] = useState<WordToken[]>(() =>
    data.words.map((word, i) => ({
      id: `w-${i}-${word}`,
      word,
    })),
  );

  const [placed, setPlaced] = useState<WordToken[]>([]);
  const [available, setAvailable] = useState<WordToken[]>(() =>
    [...tokens].sort(() => Math.random() - 0.5),
  );

  // Sync selectedAnswer whenever placed tokens change
  useEffect(() => {
    if (placed.length > 0) {
      onSelect(JSON.stringify(placed.map((t) => t.word)));
    } else {
      onSelect('');
    }
  }, [placed, onSelect]);

  const handlePlace = useCallback(
    (token: WordToken) => {
      if (showResult) return;
      setPlaced((prev) => [...prev, token]);
      setAvailable((prev) => prev.filter((t) => t.id !== token.id));
    },
    [showResult],
  );

  const handleRemove = useCallback(
    (token: WordToken) => {
      if (showResult) return;
      setPlaced((prev) => prev.filter((t) => t.id !== token.id));
      setAvailable((prev) => [...prev, token]);
    },
    [showResult],
  );

  const handleReset = useCallback(() => {
    if (showResult) return;
    setPlaced([]);
    setAvailable([...tokens].sort(() => Math.random() - 0.5));
  }, [tokens, showResult]);

  const isCorrect = answerStatus === 'correct';

  return (
    <div className="space-y-4">
      {/* Translation hint */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-200 dark:border-secondary-800 px-6 py-3">
          <p
            className="text-sm font-medium text-secondary-700 dark:text-secondary-300"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {isRTL ? data.translation_ar : data.translation_en}
          </p>
        </div>
        <p className="text-sm text-muted">
          {isRTL ? 'رتّب الكلمات لتكوين الجملة' : 'Arrange the words to form the sentence'}
        </p>
      </div>

      {/* Placed words area */}
      <div
        className={[
          'min-h-[64px] rounded-xl border-2 p-3 flex flex-wrap gap-2 justify-center items-center',
          showResult
            ? isCorrect
              ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
              : 'border-error-500 bg-error-50 dark:bg-error-900/20'
            : 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10',
        ].join(' ')}
        dir="rtl"
      >
        <AnimatePresence>
          {placed.length === 0 && !showResult && (
            <span className="text-sm text-neutral-400 dark:text-neutral-500">
              {isRTL ? 'اضغط على الكلمات أدناه' : 'Tap words below'}
            </span>
          )}
          {placed.map((token) => (
            <motion.button
              key={token.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRemove(token)}
              disabled={showResult}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-500 text-white px-3 py-2 font-vazirmatn text-lg shadow-sm hover:bg-primary-600 transition-colors"
            >
              {token.word}
              {!showResult && <X size={14} className="opacity-70" />}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Show correct answer if wrong */}
      {showResult && !isCorrect && (
        <div className="text-center" dir="rtl">
          <p className="text-xs text-muted mb-1">{isRTL ? 'الترتيب الصحيح:' : 'Correct order:'}</p>
          <p className="font-vazirmatn text-lg text-success-600">
            {data.correct_order.join(' ')}
          </p>
        </div>
      )}

      {/* Available words */}
      {!showResult && (
        <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
          {available.map((token) => (
            <motion.button
              key={token.id}
              layout
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlace(token)}
              className="rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-surface px-3 py-2 font-vazirmatn text-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              {token.word}
            </motion.button>
          ))}
        </div>
      )}

      {/* Reset button */}
      {!showResult && placed.length > 0 && (
        <div className="flex items-center justify-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw size={16} />
            {isRTL ? 'إعادة ترتيب' : 'Reset'}
          </button>
        </div>
      )}
    </div>
  );
}

export default SentenceBuilding;
