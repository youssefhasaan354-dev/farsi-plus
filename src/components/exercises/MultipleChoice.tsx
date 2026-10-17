import { motion } from 'framer-motion';
import type { MultipleChoiceData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface MultipleChoiceProps {
  data: MultipleChoiceData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
}

export function MultipleChoice({
  data,
  selectedAnswer,
  onSelect,
  answerStatus,
  correctAnswer,
}: MultipleChoiceProps) {
  const isRTL = useIsRTL();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800"
          style={{ minWidth: 120, minHeight: 120 }}
        >
          <span className="font-vazirmatn text-6xl text-primary-700 dark:text-primary-300" dir="rtl">
            {data.display}
          </span>
        </div>
        <p className="text-sm text-muted text-center">
          {isRTL ? 'اختر الحرف الصحيح' : 'Select the correct letter'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showResult = answerStatus !== 'idle';

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
              className={[
                'flex items-center justify-center rounded-xl border-2 p-4 transition-all duration-200',
                stateClass,
              ].join(' ')}
            >
              <span className="font-vazirmatn text-4xl" dir="rtl">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default MultipleChoice;
