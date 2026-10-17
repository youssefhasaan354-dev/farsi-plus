import type { Exercise } from '@/types/lesson';
import { useUIStore } from '@/stores/uiStore';
import MultipleChoice from './MultipleChoice';
import WordMatching from './WordMatching';
import Listening from './Listening';
import FillBlank from './FillBlank';
import PictureWord from './PictureWord';
import LetterTracing from './LetterTracing';
import TypingPersian from './TypingPersian';
import SentenceBuilding from './SentenceBuilding';
import TranslationExercise from './TranslationExercise';
import Pronunciation from './Pronunciation';
import { ReportError } from './ReportError';

interface ExerciseRendererProps {
  exercise: Exercise;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  answerStatus: 'idle' | 'correct' | 'wrong';
}

export function ExerciseRenderer({
  exercise,
  selectedAnswer,
  onSelect,
  answerStatus,
}: ExerciseRendererProps) {
  const { language } = useUIStore();
  const isRTL = language === 'ar';

  const question = isRTL ? exercise.question_ar : exercise.question_en;
  const correctAnswer = (exercise.data['correct'] as string) ?? '';

  const renderExercise = () => {
    switch (exercise.type) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            data={exercise.data as unknown as import('@/types/lesson').MultipleChoiceData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'word_matching':
        return (
          <WordMatching
            data={exercise.data as unknown as import('@/types/lesson').WordMatchingData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
          />
        );
      case 'listening':
        return (
          <Listening
            data={exercise.data as unknown as import('@/types/lesson').ListeningData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'fill_blank':
        return (
          <FillBlank
            data={exercise.data as unknown as import('@/types/lesson').FillBlankData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'picture_word':
        return (
          <PictureWord
            data={exercise.data as unknown as import('@/types/lesson').PictureWordData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'letter_tracing':
        return (
          <LetterTracing
            data={exercise.data as unknown as import('@/types/lesson').LetterTracingData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
          />
        );
      case 'typing_persian':
        return (
          <TypingPersian
            data={exercise.data as unknown as import('@/types/lesson').TypingPersianData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'sentence_building':
        return (
          <SentenceBuilding
            data={exercise.data as unknown as import('@/types/lesson').SentenceBuildingData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
          />
        );
      case 'translation':
        return (
          <TranslationExercise
            data={exercise.data as unknown as import('@/types/lesson').TranslationData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
            correctAnswer={correctAnswer}
          />
        );
      case 'pronunciation':
        return (
          <Pronunciation
            data={exercise.data as unknown as import('@/types/lesson').PronunciationData}
            selectedAnswer={selectedAnswer}
            onSelect={onSelect}
            answerStatus={answerStatus}
          />
        );
      case 'dialogue_roleplay':
      case 'story_reading':
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-200 dark:border-secondary-800 text-center">
            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-200">
              {isRTL
                ? 'هذا النوع من التمارين قيد التطوير وسيتاح في تحديث قادم.'
                : 'This exercise type is under development and will be available soon.'}
            </p>
            <button
              onClick={() => onSelect('skipped')}
              className="rounded-xl bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              {isRTL ? 'تخطّي التمرين ومتابعة الدرس' : 'Skip & continue lesson'}
            </button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl bg-secondary-50 dark:bg-secondary-900/20 border-2 border-secondary-200 dark:border-secondary-800 text-center">
            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-200">
              {isRTL ? 'نوع تمرين غير مدعوم بعد' : 'Exercise type not yet supported'}
            </p>
            <button
              onClick={() => onSelect('skipped')}
              className="rounded-xl bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              {isRTL ? 'تخطّي التمرين ومتابعة الدرس' : 'Skip & continue'}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {question && (
        <h3 className="text-lg font-bold text-center">{question}</h3>
      )}
      {renderExercise()}
      <div className="flex justify-end pt-2">
        <ReportError exerciseId={exercise.id} />
      </div>
    </div>
  );
}

export default ExerciseRenderer;
