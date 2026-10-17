import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, Check } from 'lucide-react';
import type { TypingPersianData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface PersianKeyboardProps {
  onKey: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

const PERSIAN_ROW1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ'];
const PERSIAN_ROW2 = ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م'];
const PERSIAN_ROW3 = ['ک', 'گ', 'پ', 'چ', 'ج', 'ح', 'ع', 'ف'];
const PERSIAN_ROW4_BASE = ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'ئ', 'و'];
const PERSIAN_EXTRA = ['آ', 'ژ', 'ء', 'ـ'];

export function PersianKeyboard({ onKey, onBackspace, onEnter, disabled }: PersianKeyboardProps) {
  const [shift, setShift] = useState(false);

  const shiftMap: Record<string, string> = {
    'ا': 'آ',
    'ه': 'ة',
    'ی': 'ي',
    'ک': 'ك',
  };

  const handleKey = (key: string) => {
    if (disabled) return;
    const finalKey = shift && shiftMap[key] ? shiftMap[key] : key;
    onKey(finalKey);
    if (shift) setShift(false);
  };

  const keyClass = 'flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-600 bg-surface hover:bg-primary-50 dark:hover:bg-primary-900/20 active:bg-primary-100 dark:active:bg-primary-900/30 font-vazirmatn text-lg transition-colors select-none';
  const keyDim = { width: 40, height: 48 };

  return (
    <div className="space-y-1.5" dir="rtl">
      {/* Row 1 */}
      <div className="flex justify-center gap-1">
        {PERSIAN_ROW1.map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.9 }} disabled={disabled}
            onClick={() => handleKey(k)} className={keyClass} style={keyDim}>
            {shift && shiftMap[k] ? shiftMap[k] : k}
          </motion.button>
        ))}
      </div>
      {/* Row 2 */}
      <div className="flex justify-center gap-1">
        {PERSIAN_ROW2.map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.9 }} disabled={disabled}
            onClick={() => handleKey(k)} className={keyClass} style={keyDim}>
            {shift && shiftMap[k] ? shiftMap[k] : k}
          </motion.button>
        ))}
      </div>
      {/* Row 3 */}
      <div className="flex justify-center gap-1">
        {PERSIAN_ROW3.map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.9 }} disabled={disabled}
            onClick={() => handleKey(k)} className={keyClass} style={keyDim}>
            {shift && shiftMap[k] ? shiftMap[k] : k}
          </motion.button>
        ))}
      </div>
      {/* Row 4 + extras + controls */}
      <div className="flex justify-center gap-1 flex-wrap">
        {PERSIAN_ROW4_BASE.map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.9 }} disabled={disabled}
            onClick={() => handleKey(k)} className={keyClass} style={keyDim}>
            {shift && shiftMap[k] ? shiftMap[k] : k}
          </motion.button>
        ))}
        {PERSIAN_EXTRA.map((k) => (
          <motion.button key={k} whileTap={{ scale: 0.9 }} disabled={disabled}
            onClick={() => handleKey(k)} className={keyClass} style={keyDim}>
            {k}
          </motion.button>
        ))}
        {/* Shift */}
        <motion.button whileTap={{ scale: 0.9 }} disabled={disabled}
          onClick={() => setShift(!shift)}
          className={[
            'flex items-center justify-center rounded-lg border px-3 transition-colors select-none text-sm font-medium',
            shift
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
              : 'border-neutral-200 dark:border-neutral-600 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800',
          ].join(' ')}
          style={{ height: 48 }}>
          Shift
        </motion.button>
        {/* Backspace */}
        <motion.button whileTap={{ scale: 0.9 }} disabled={disabled}
          onClick={onBackspace}
          className="flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-600 bg-surface hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors select-none"
          style={{ width: 56, height: 48 }}>
          <Delete size={18} />
        </motion.button>
        {/* Enter / Submit */}
        <motion.button whileTap={{ scale: 0.9 }} disabled={disabled}
          onClick={onEnter}
          className="flex items-center justify-center rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors select-none"
          style={{ width: 72, height: 48 }}>
          <Check size={20} />
        </motion.button>
      </div>
    </div>
  );
}

interface TypingPersianProps {
  data: TypingPersianData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
}

export function TypingPersian({
  data,
  onSelect,
  answerStatus,
  correctAnswer,
}: TypingPersianProps) {
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
    if (showResult || !input) return;
    onSelect(input);
  }, [input, onSelect, showResult]);

  // Also accept physical keyboard input
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

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-200 dark:border-secondary-800 px-6 py-3">
          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300" dir={isRTL ? 'rtl' : 'ltr'}>
            {data.prompt}
          </p>
        </div>
        <p className="text-sm text-muted">
          {isRTL ? 'اكتب الكلمة بالفارسية' : 'Type the word in Persian'}
        </p>
      </div>

      {/* Input display */}
      <div
        className="flex items-center justify-center rounded-xl border-2 border-primary-200 dark:border-primary-800 bg-white dark:bg-neutral-900 min-h-[60px] px-4"
        dir="rtl"
        tabIndex={0}
        onKeyDown={handlePhysicalKey}
      >
        <span className="font-vazirmatn text-3xl text-primary-700 dark:text-primary-300">
          {input || <span className="text-neutral-300 dark:text-neutral-600 text-xl">{data.placeholder}</span>}
        </span>
      </div>

      {showResult && (
        <div className="text-center space-y-1">
          <p className={`text-sm font-semibold ${answerStatus === 'correct' ? 'text-success-600' : 'text-error-500'}`}>
            {answerStatus === 'correct'
              ? (isRTL ? 'إجابة صحيحة!' : 'Correct!')
              : (isRTL ? 'الإجابة الصحيحة:' : 'Correct answer:')}
          </p>
          {answerStatus === 'wrong' && (
            <p className="font-vazirmatn text-2xl text-success-600" dir="rtl">{correctAnswer}</p>
          )}
        </div>
      )}

      {/* On-screen keyboard */}
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

export default TypingPersian;
