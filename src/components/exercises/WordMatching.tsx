import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { WordMatchingData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface WordMatchingProps {
  data: WordMatchingData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
}

interface Match {
  left: string;
  right: string;
}

export function WordMatching({
  data,
  onSelect,
  answerStatus,
}: WordMatchingProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';

  const shuffledRight = useMemo(() => {
    return [...data.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5);
  }, [data.pairs]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(null);

  const matchedLefts = matches.map((m) => m.left);
  const matchedRights = matches.map((m) => m.right);

  const handleLeftClick = (left: string) => {
    if (showResult || matchedLefts.includes(left)) return;
    setSelectedLeft(left);
  };

  const handleRightClick = (right: string) => {
    if (showResult || !selectedLeft || matchedRights.includes(right)) return;

    const pair = data.pairs.find((p) => p.left === selectedLeft);
    if (pair && pair.right === right) {
      const newMatches = [...matches, { left: selectedLeft, right }];
      setMatches(newMatches);
      setSelectedLeft(null);
      if (newMatches.length === data.pairs.length) {
        onSelect(JSON.stringify(newMatches));
      }
    } else {
      setWrongFlash({ left: selectedLeft, right });
      setTimeout(() => setWrongFlash(null), 600);
      setSelectedLeft(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted text-center">
        {isRTL ? 'اربط كل كلمة فارسية بمرادفها العربي' : 'Match each Persian word with its Arabic meaning'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column — Persian */}
        <div className="space-y-2">
          {data.pairs.map((pair) => {
            const isMatched = matchedLefts.includes(pair.left);
            const isSelected = selectedLeft === pair.left;
            const isWrong = wrongFlash?.left === pair.left;

            let cls = 'border-neutral-200 dark:border-neutral-700 bg-surface hover:border-primary-400';
            if (isMatched) cls = 'border-success-500 bg-success-50 dark:bg-success-900/20 opacity-60';
            else if (isWrong) cls = 'border-error-500 bg-error-50 dark:bg-error-900/20';
            else if (isSelected) cls = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300';

            return (
              <motion.button
                key={pair.left}
                whileTap={{ scale: showResult || isMatched ? 1 : 0.96 }}
                animate={isWrong ? { x: [0, -4, 4, -4, 0] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleLeftClick(pair.left)}
                disabled={showResult || isMatched}
                className={['w-full rounded-xl border-2 px-4 py-3 transition-all', cls].join(' ')}
              >
                <span className="font-vazirmatn text-2xl" dir="rtl">{pair.left}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right column — Arabic */}
        <div className="space-y-2">
          {shuffledRight.map((right) => {
            const isMatched = matchedRights.includes(right);
            const isWrong = wrongFlash?.right === right;

            let cls = 'border-neutral-200 dark:border-neutral-700 bg-surface hover:border-primary-400';
            if (isMatched) cls = 'border-success-500 bg-success-50 dark:bg-success-900/20 opacity-60';
            else if (isWrong) cls = 'border-error-500 bg-error-50 dark:bg-error-900/20';

            return (
              <motion.button
                key={right}
                whileTap={{ scale: showResult || isMatched ? 1 : 0.96 }}
                animate={isWrong ? { x: [0, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleRightClick(right)}
                disabled={showResult || isMatched}
                className={['w-full rounded-xl border-2 px-4 py-3 transition-all', cls].join(' ')}
              >
                <span className="font-cairo text-xl">{right}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WordMatching;
