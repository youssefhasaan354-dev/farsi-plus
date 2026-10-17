import { create } from 'zustand';
import type { Exercise } from '@/types/lesson';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export type AnswerStatus = 'idle' | 'correct' | 'wrong';

interface LessonState {
  lessonId: string | null;
  lessonTitle: string | null;
  exercises: Exercise[];
  currentIndex: number;
  selectedAnswer: string | null;
  answerStatus: AnswerStatus;
  hearts: number;
  xpEarned: number;
  correctCount: number;
  wrongCount: number;
  loading: boolean;
  completed: boolean;
  error: string | null;

  startLesson: (lessonId: string, lessonTitle: string) => Promise<void>;
  submitAnswer: (answer: string) => void;
  checkAnswer: () => Promise<boolean>;
  nextExercise: () => void;
  reset: () => void;
}

import { isCorrectAnswer } from '@/lib/exercise';

export const useLessonStore = create<LessonState>((set, get) => ({
  lessonId: null,
  lessonTitle: null,
  exercises: [],
  currentIndex: 0,
  selectedAnswer: null,
  answerStatus: 'idle',
  hearts: 5,
  xpEarned: 0,
  correctCount: 0,
  wrongCount: 0,
  loading: false,
  completed: false,
  error: null,

  startLesson: async (lessonId: string, lessonTitle: string) => {
    set({ loading: true, error: null, lessonId, lessonTitle });
    const profile = useAuthStore.getState().profile;
    const hearts = profile?.hearts ?? 5;
    if (hearts <= 0) {
      set({ loading: false, error: 'no_hearts' });
      return;
    }

    // Register active attempt on server
    try {
      await supabase.rpc('start_lesson_attempt', { p_lesson_id: lessonId });
    } catch {
      // Non-blocking if offline/migrating
    }

    // Fetch exercises via secure RPC or fallback query
    let exercisesData: Exercise[] | null = null;
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_lesson_exercises', {
      p_lesson_id: lessonId,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      exercisesData = rpcData as unknown as Exercise[];
    } else {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, lesson_id, type, question_ar, question_en, data, hints_ar, hints_en, sort_order')
        .eq('lesson_id', lessonId)
        .order('sort_order', { ascending: true });

      if (error) {
        set({ loading: false, error: error.message });
        return;
      }
      exercisesData = (data ?? []) as unknown as Exercise[];
    }

    if (!exercisesData || exercisesData.length === 0) {
      set({ loading: false, error: 'no_exercises' });
      return;
    }

    set({
      exercises: exercisesData,
      currentIndex: 0,
      selectedAnswer: null,
      answerStatus: 'idle',
      hearts,
      xpEarned: 0,
      correctCount: 0,
      wrongCount: 0,
      loading: false,
      completed: false,
      error: null,
    });
  },

  submitAnswer: (answer: string) => {
    set({ selectedAnswer: answer });
  },

  checkAnswer: async () => {
    const state = get();
    const exercise = state.exercises[state.currentIndex];
    if (!exercise || state.selectedAnswer === null) return false;

    // Pronunciation exercise or skipped exercises do not award XP or deduct hearts
    if (exercise.type === 'pronunciation' || state.selectedAnswer === 'skipped') {
      set({
        answerStatus: 'correct',
      });
      return true;
    }

    const correct = isCorrectAnswer(exercise, state.selectedAnswer);
    if (correct) {
      set({
        answerStatus: 'correct',
        xpEarned: state.xpEarned + 10,
        correctCount: state.correctCount + 1,
      });
      return true;
    } else {
      let remainingHearts = Math.max(0, state.hearts - 1);
      try {
        const { data: serverHearts, error: rpcErr } = await supabase.rpc('lose_heart');
        if (!rpcErr && typeof serverHearts === 'number') {
          remainingHearts = serverHearts;
        }
      } catch (err) {
        console.error('Failed to deduct heart on server:', err);
      }

      // Sync authStore profile hearts
      const authProfile = useAuthStore.getState().profile;
      if (authProfile) {
        useAuthStore.setState({
          profile: { ...authProfile, hearts: remainingHearts },
        });
      }

      set({
        answerStatus: 'wrong',
        hearts: remainingHearts,
        wrongCount: state.wrongCount + 1,
      });

      return false;
    }
  },

  nextExercise: () => {
    const state = get();
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.exercises.length) {
      set({ completed: true });
    } else {
      set({
        currentIndex: nextIndex,
        selectedAnswer: null,
        answerStatus: 'idle',
      });
    }
  },

  reset: () => {
    set({
      lessonId: null,
      lessonTitle: null,
      exercises: [],
      currentIndex: 0,
      selectedAnswer: null,
      answerStatus: 'idle',
      hearts: 5,
      xpEarned: 0,
      correctCount: 0,
      wrongCount: 0,
      loading: false,
      completed: false,
      error: null,
    });
  },
}));
