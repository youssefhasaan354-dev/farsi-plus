export type LessonEffectiveStatus = 'available' | 'in_progress' | 'completed' | 'locked';

export interface ComputeStatusParams {
  isLessonLockedByDb: boolean;
  lessonIndex: number;
  prevLessonCompleted: boolean;
  userProgressStatus?: string | null;
}

/**
 * Computes whether a lesson is locked, available, in progress, or completed.
 * Rule: Lesson 1 is accessible if not DB-locked; subsequent lessons require previous lesson completion.
 */
export function computeLessonStatus({
  isLessonLockedByDb,
  lessonIndex,
  prevLessonCompleted,
  userProgressStatus,
}: ComputeStatusParams): LessonEffectiveStatus {
  const isAccessible = !isLessonLockedByDb && (lessonIndex === 0 || prevLessonCompleted);

  if (!isAccessible) {
    return 'locked';
  }

  if (userProgressStatus === 'completed') {
    return 'completed';
  }
  if (userProgressStatus === 'in_progress') {
    return 'in_progress';
  }
  return 'available';
}
