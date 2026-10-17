import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import type { ListeningData } from '@/types/lesson';
import { useIsRTL } from '@/lib/useIsRTL';

interface ListeningProps {
  data: ListeningData & { audio_url?: string };
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
  correctAnswer: string;
}

export function Listening({
  data,
  selectedAnswer,
  onSelect,
  answerStatus,
  correctAnswer,
}: ListeningProps) {
  const isRTL = useIsRTL();
  const showResult = answerStatus !== 'idle';
  const [speechSupported, setSpeechSupported] = useState(true);
  const [hasFaVoice, setHasFaVoice] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const checkVoices = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeechSupported(false);
      setHasFaVoice(false);
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const found = voices.some(
        (v) =>
          v.lang.toLowerCase().startsWith('fa') ||
          v.lang.toLowerCase().includes('fa-ir') ||
          v.lang.toLowerCase().includes('per'),
      );
      setHasFaVoice(found);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeechSupported(false);
      setHasFaVoice(false);
      return;
    }

    checkVoices();

    const onVoicesChanged = () => {
      checkVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [checkVoices]);

  const speak = () => {
    if (data.audio_url) {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.audio_url);
        audioRef.current = audio;
        setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          // Fall back to TTS if audio file fails
          speakTTS();
        };
        audio.play().catch(() => {
          setIsPlaying(false);
          speakTTS();
        });
        return;
      } catch {
        // Fall back to TTS
      }
    }

    speakTTS();
  };

  const speakTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(data.text_to_speak);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.7;

    const voices = window.speechSynthesis.getVoices();
    const faVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('fa') ||
        v.lang.toLowerCase().includes('fa-ir') ||
        v.lang.toLowerCase().includes('per'),
    );
    if (faVoice) {
      utterance.voice = faVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const audioAvailable = !!data.audio_url || hasFaVoice !== false;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted text-center">
        {isRTL ? 'استمع واختر الكلمة الصحيحة' : 'Listen and choose the correct word'}
      </p>

      {/* Audio button */}
      <div className="flex flex-col items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={speak}
          disabled={!speechSupported || showResult}
          className="flex items-center justify-center rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          style={{ width: 80, height: 80 }}
          aria-label={isRTL ? 'تشغيل الصوت' : 'Play audio'}
        >
          {isPlaying ? <VolumeX size={36} /> : <Volume2 size={36} />}
        </motion.button>
        <button
          onClick={speak}
          disabled={!speechSupported || showResult}
          className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline disabled:opacity-50"
        >
          {isPlaying
            ? (isRTL ? 'جارٍ التشغيل...' : 'Playing...')
            : (isRTL ? 'اضغط للاستماع' : 'Tap to listen')}
        </button>

        {/* Warning if device does not support speech / no Persian voice found */}
        {(!speechSupported || (!data.audio_url && hasFaVoice === false)) && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 max-w-sm text-center">
            <AlertCircle size={16} className="shrink-0 text-amber-500" />
            <p>
              {isRTL
                ? 'لا يتوفر صوت فارسي مثبت على هذا الجهاز. نص الاستماع:'
                : 'No Persian voice found on this device. Spoken text:'}
            </p>
          </div>
        )}

        {(!audioAvailable || !speechSupported) && (
          <p className="font-vazirmatn text-3xl text-primary-600 dark:text-primary-400" dir="rtl">
            {data.text_to_speak}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {data.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;

          let stateClass =
            'border-neutral-200 dark:border-neutral-700 bg-surface hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20';
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
              onClick={() => (showResult ? undefined : onSelect(option))}
              disabled={showResult}
              className={[
                'flex items-center justify-center rounded-xl border-2 p-4 transition-all',
                stateClass,
              ].join(' ')}
            >
              <span className="font-vazirmatn text-3xl" dir="rtl">
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default Listening;
