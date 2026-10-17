import { motion } from 'framer-motion';
import type { FillBlankData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface FillBlankProps {
  data: FillBlankData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
}

export function FillBlank({
  data,
  selectedAnswer,
  onSelect,
  answerStatus,
  correctAnswer,
}: FillBlankProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';

  const parts = data.display.split('_');
  const filledDisplay = selectedAnswer
    ? data.display.replace('_', selectedAnswer)
    : data.display;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 px-8 py-6"
          dir="rtl"
        >
          <span className="font-vazirmatn text-5xl text-primary-700 dark:text-primary-300">
            {showResult ? data.word : filledDisplay}
          </span>
        </div>
        <p className="text-sm text-muted text-center">
          {isRTL ? 'اختر الحرف الذي يملأ الفراغ' : 'Choose the letter that fills the blank'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;

          let stateClass = 'border-neutral-200 dark:border-neutral-700 bg-surface hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20';
          if (showResult && isCorrect) {
            stateClass = 'border-success-500 bg-success-50 dark:bg-success-900/20';
          } else if (showResult && isSelected && !isCorrect) {
            stateClass = 'border-error-500 bg-error-50 dark:bg-error-900/20';
          } else if (isSelected) {
            stateClass = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
          } else if (showResult) {
            stateClass = 'border-neutral-200 dark:border-neutral-700 opacity-50';
          }

          return (
            <motion.button
              key={option}
              whileTap={{ scale: showResult ? 1 : 0.96 }}
              onClick={() => showResult ? undefined : onSelect(option)}
              disabled={showResult}
              className={['flex items-center justify-center rounded-xl border-2 p-3 transition-all', stateClass].join(' ')}
            >
              <span className="font-vazirmatn text-3xl" dir="rtl">{option}</span>
            </motion.button>
          );
        })}
      </div>

      {parts.length > 1 && !showResult && (
        <p className="text-xs text-muted text-center" dir="rtl">
          {isRTL ? `الفراغ في: ${data.blank_position === 'start' ? 'البداية' : data.blank_position === 'end' ? 'النهاية' : 'الوسط'}` : `Blank position: ${data.blank_position}`}
        </p>
      )}
    </div>
  );
}

export default FillBlank;
