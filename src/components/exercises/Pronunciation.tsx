import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, ThumbsUp, ThumbsDown, Minus, AlertCircle, FastForward } from 'lucide-react';
import type { PronunciationData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface PronunciationProps {
  data: PronunciationData;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionInstanceLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

export function Pronunciation({
  data,
  onSelect,
  answerStatus,
}: PronunciationProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';

  const [speechSupported, setSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);

  useEffect(() => {
    const globalWindow = typeof window !== 'undefined'
      ? (window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstanceLike;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike;
        })
      : undefined;

    const SpeechRecognitionClass =
      globalWindow?.SpeechRecognition || globalWindow?.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'fa-IR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const result = event.results[0][0];
        setTranscript(result.transcript);
        setIsListening(false);
        setErrorMessage(null);
        onSelect(result.transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorLike) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            isRTL
              ? 'تم رفض إذن استخدام الميكروفون. يرجى السماح به من إعدادات المتصفح أو تقييم نفسك أدناه.'
              : 'Microphone permission was denied. Please enable it in browser settings or rate yourself below.',
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            isRTL
              ? 'لم يُسمع أي صوت. حاول مجدداً أو قيّم نفسك أدناه.'
              : 'No speech was detected. Try again or rate yourself below.',
          );
        } else {
          setErrorMessage(
            isRTL
              ? 'تعذّر التعرف على الصوت. جرّب مجدداً أو قيّم نفسك أدناه.'
              : 'Speech recognition error. Try again or rate yourself below.',
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [onSelect, isRTL]);

  const handleStartListening = useCallback(() => {
    if (!recognitionRef.current || isListening || showResult) return;
    setTranscript('');
    setErrorMessage(null);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
      setErrorMessage(
        isRTL
          ? 'تعذّر تشغيل الميكروفون. يرجى استخدام التقييم الذاتي أدناه.'
          : 'Could not access microphone. Please use self-rating below.',
      );
    }
  }, [isListening, showResult, isRTL]);

  const speakWord = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(data.text_to_speak);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  }, [data.text_to_speak]);

  const handleSelfRate = useCallback(
    (rating: 'good' | 'ok' | 'bad') => {
      onSelect(`self:${rating}`);
    },
    [onSelect],
  );

  const handleSkip = useCallback(() => {
    onSelect('skipped');
  }, [onSelect]);

  return (
    <div className="space-y-4">
      {/* Optional badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300">
          {isRTL ? 'تمرين اختياري (تقييم ذاتي)' : 'Optional practice (self-assessed)'}
        </span>
        {!showResult && (
          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary-600 transition-colors"
          >
            <FastForward size={14} />
            {isRTL ? 'تخطّي' : 'Skip'}
          </button>
        )}
      </div>

      {/* Word to pronounce */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted text-center">
          {isRTL ? 'انطق هذه الكلمة بصوت عالٍ' : 'Pronounce this word out loud'}
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 px-8 py-4"
            dir="rtl"
          >
            <span className="font-vazirmatn text-4xl text-primary-700 dark:text-primary-300">
              {data.text_to_speak}
            </span>
          </div>
          <button
            onClick={speakWord}
            disabled={showResult}
            className="flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 hover:bg-secondary-200 transition-colors"
            style={{ width: 44, height: 44 }}
            aria-label={isRTL ? 'استمع للكلمة' : 'Listen to word'}
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      {speechSupported ? (
        <>
          {/* Mic button */}
          <div className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartListening}
              disabled={isListening || showResult}
              className={[
                'flex items-center justify-center rounded-full shadow-lg transition-colors',
                isListening
                  ? 'bg-error-500 text-white animate-pulse'
                  : 'bg-primary-500 text-white hover:bg-primary-600',
              ].join(' ')}
              style={{ width: 72, height: 72 }}
              aria-label={isRTL ? 'ابدأ التحدث' : 'Start speaking'}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </motion.button>
            <p className="text-xs text-muted">
              {isListening
                ? (isRTL ? 'جارٍ الاستماع... تكلّم الآن' : 'Listening... speak now')
                : (isRTL ? 'اضغط للتحدث' : 'Tap to speak')}
            </p>
            {transcript && (
              <div className="rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 px-4 py-2 mt-2">
                <p className="text-xs text-muted mb-1">{isRTL ? 'تم التقاط:' : 'Heard:'}</p>
                <p className="font-vazirmatn text-xl" dir="rtl">{transcript}</p>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 max-w-sm text-center">
                <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Fallback self-rating */}
          {!showResult && (
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <p className="text-xs text-muted text-center mb-2">
                {isRTL ? 'أو قيّم نطقك بنفسك:' : 'Or rate your pronunciation:'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <SelfRateButton icon={<ThumbsUp size={18} />} label={isRTL ? 'ممتاز' : 'Good'} color="success" onClick={() => handleSelfRate('good')} />
                <SelfRateButton icon={<Minus size={18} />} label={isRTL ? 'متوسط' : 'OK'} color="secondary" onClick={() => handleSelfRate('ok')} />
                <SelfRateButton icon={<ThumbsDown size={18} />} label={isRTL ? 'ضعيف' : 'Poor'} color="error" onClick={() => handleSelfRate('bad')} />
              </div>
            </div>
          )}
        </>
      ) : (
        // No SpeechRecognition support (iOS Safari / Firefox)
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-start gap-2 text-xs text-secondary-800 dark:text-secondary-200 bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-xl p-3 text-center max-w-sm">
            <AlertCircle size={18} className="shrink-0 text-secondary-500 mt-0.5" />
            <p>
              {isRTL
                ? 'متصفحك لا يدعم التعرف على الصوت المباشر. تدرّب على النطق بصوت عالٍ ثم قيّم نفسك أدناه.'
                : 'Your browser does not support speech recognition. Practice speaking out loud and rate yourself below.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <SelfRateButton icon={<ThumbsUp size={18} />} label={isRTL ? 'ممتاز' : 'Good'} color="success" onClick={() => handleSelfRate('good')} disabled={showResult} />
            <SelfRateButton icon={<Minus size={18} />} label={isRTL ? 'متوسط' : 'OK'} color="secondary" onClick={() => handleSelfRate('ok')} disabled={showResult} />
            <SelfRateButton icon={<ThumbsDown size={18} />} label={isRTL ? 'ضعيف' : 'Poor'} color="error" onClick={() => handleSelfRate('bad')} disabled={showResult} />
          </div>
        </div>
      )}

      {showResult && (
        <p className="text-center text-sm font-semibold text-success-600">
          {isRTL ? 'أحسنت! استمر في التدرّب.' : 'Well done! Keep practicing.'}
        </p>
      )}
    </div>
  );
}

function SelfRateButton({
  icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'success' | 'secondary' | 'error';
  onClick: () => void;
  disabled?: boolean;
}) {
  const colors = {
    success: 'border-success-500 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20',
    secondary: 'border-secondary-500 text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-900/20',
    error: 'border-error-500 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex flex-col items-center gap-1 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        colors[color],
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

export default Pronunciation;
