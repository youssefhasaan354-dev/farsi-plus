import { useState, useCallback, useEffect } from 'react';
import type { TranslationData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';
import { PersianKeyboard } from './TypingPersian';

interface TranslationExerciseProps {
  data: TranslationData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
}

export function TranslationExercise({
  data,
  onSelect,
  answerStatus,
  correctAnswer,
}: TranslationExerciseProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';
  const [input, setInput] = useState('');

  useEffect(() => {
    if (answerStatus === 'idle') {
      setInput('');
    }
  }, [answerStatus]);

  useEffect(() => {
    onSelect(input);
  }, [input, onSelect]);

  const handleKey = useCallback((key: string) => {
    if (showResult) return;
    setInput((prev) => prev + key);
  }, [showResult]);

  const handleBackspace = useCallback(() => {
    if (showResult) return;
    setInput((prev) => prev.slice(0, -1));
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (showResult || !input.trim()) return;
    onSelect(input.trim());
  }, [input, onSelect, showResult]);

  const handlePhysicalKey = useCallback((e: React.KeyboardEvent) => {
    if (showResult) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [showResult, handleBackspace, handleSubmit]);

  const isArToFa = data.direction === 'ar_to_fa';

  return (
    <div className="space-y-4">
      {/* Source text */}
      <div className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary-50 dark:bg-secondary-900/20 px-3 py-1 text-xs font-semibold text-secondary-600 dark:text-secondary-400">
          {isArToFa
            ? (isRTL ? 'عربي ← فارسي' : 'Arabic → Persian')
            : (isRTL ? 'فارسي ← عربي' : 'Persian → Arabic')}
        </div>
        <div
          className="rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-200 dark:border-secondary-800 px-6 py-3"
          dir="rtl"
        >
          <p className={`text-xl font-medium text-secondary-800 dark:text-secondary-200 ${isArToFa ? 'font-cairo' : 'font-vazirmatn'}`}>
            {data.source_text}
          </p>
        </div>
        {data.hint && (
          <p className="text-xs text-muted">{data.hint}</p>
        )}
      </div>

      {/* Input display */}
      <div
        className="flex items-center justify-center rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-neutral-900 min-h-[60px] px-4"
        dir="rtl"
        tabIndex={0}
        onKeyDown={handlePhysicalKey}
      >
        <span className="font-vazirmatn text-3xl text-primary-700 dark:text-primary-300">
          {input || <span className="text-neutral-300 dark:text-neutral-600 text-xl">{isRTL ? 'اكتب الترجمة...' : 'Type the translation...'}</span>}
        </span>
      </div>

      {showResult && (
        <div className="text-center space-y-1">
          <p className={`text-sm font-semibold ${answerStatus === 'correct' ? 'text-success-600' : 'text-error-500'}`}>
            {answerStatus === 'correct'
              ? (isRTL ? 'ترجمة صحيحة!' : 'Correct translation!')
              : (isRTL ? 'الترجمة الصحيحة:' : 'Correct translation:')}
          </p>
          {answerStatus === 'wrong' && (
            <p className="font-vazirmatn text-2xl text-success-600" dir="rtl">{correctAnswer}</p>
          )}
        </div>
      )}

      {/* On-screen keyboard (always Persian — the target is Persian) */}
      {!showResult && (
        <PersianKeyboard
          onKey={handleKey}
          onBackspace={handleBackspace}
          onEnter={handleSubmit}
        />
      )}
    </div>
  );
}

export default TranslationExercise;
