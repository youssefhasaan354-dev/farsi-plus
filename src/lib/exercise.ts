import type { Exercise } from '@/types/lesson';
import { textMatches } from '@/lib/textNormalize';

/**
 * Returns a human-readable representation of the correct answer for any exercise type.
 * Used for displaying feedback on wrong answers without runtime errors.
 */
export function getCorrectAnswerText(exercise: Exercise | null | undefined): string {
  if (!exercise || !exercise.data) return '';

  const data = exercise.data;

  switch (exercise.type) {
    case 'multiple_choice':
    case 'listening':
    case 'fill_blank':
    case 'picture_word':
    case 'typing_persian':
    case 'translation': {
      if (typeof data.correct === 'string') {
        return data.correct;
      }
      if (typeof exercise.correct_answer === 'string') {
        return exercise.correct_answer;
      }
      return '';
    }

    case 'sentence_building': {
      const order = data.correct_order;
      if (Array.isArray(order)) {
        return order.join(' ');
      }
      return '';
    }

    case 'word_matching': {
      const pairs = data.pairs as Array<{ left?: string; right?: string; fa?: string; ar?: string; en?: string }> | undefined;
      if (Array.isArray(pairs)) {
        return pairs
          .map((p) => {
            const left = p.left ?? p.fa ?? '';
            const right = p.right ?? p.ar ?? p.en ?? '';
            return `${left} ↔ ${right}`;
          })
          .filter(Boolean)
          .join(' ، ');
      }
      return '';
    }

    case 'letter_tracing':
    case 'pronunciation':
      return '';

    default: {
      if (typeof data.correct === 'string') return data.correct;
      if (typeof exercise.correct_answer === 'string') return exercise.correct_answer;
      return '';
    }
  }
}

/**
 * Validates a user-submitted answer against the exercise definition.
 */
export function isCorrectAnswer(exercise: Exercise, answer: string): boolean {
  if (answer === 'skipped') return true;
  switch (exercise.type) {
    case 'multiple_choice':
    case 'listening':
    case 'fill_blank':
    case 'picture_word': {
      const correct = exercise.data['correct'] as string;
      return answer === correct;
    }
    case 'word_matching': {
      const pairs = exercise.data['pairs'] as { left: string; right: string }[];
      try {
        const parsed = JSON.parse(answer) as { left: string; right: string }[];
        if (parsed.length !== pairs.length) return false;
        return pairs.every((pair) => {
          const match = parsed.find(
            (m) => m.left === pair.left && m.right === pair.right,
          );
          return match !== undefined;
        });
      } catch {
        return false;
      }
    }
    case 'typing_persian': {
      const correct = exercise.data['correct'] as string;
      return textMatches(correct, answer);
    }
    case 'sentence_building': {
      const correctOrder = exercise.data['correct_order'] as string[];
      try {
        const parsed = JSON.parse(answer) as string[];
        if (parsed.length !== correctOrder.length) return false;
        return correctOrder.every((word, i) => parsed[i] === word);
      } catch {
        return false;
      }
    }
    case 'translation': {
      const correct = exercise.data['correct'] as string;
      return textMatches(correct, answer);
    }
    case 'letter_tracing': {
      const score = parseFloat(answer);
      const passingScore = (exercise.data['passing_score'] as number) ?? 50;
      return score >= passingScore;
    }
    case 'pronunciation': {
      return answer.length > 0;
    }
    default:
      return false;
  }
}
