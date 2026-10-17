import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  native_language: string;
  learning_goal: string | null;
  daily_goal_minutes: number;
  daily_goal_xp: number;
  cefr_level: string;
  is_premium: boolean;
  role: 'user' | 'admin';
  total_xp: number;
  hearts: number;
  gems: number;
  streak_count: number;
  streak_freeze_count: number;
  timezone?: string;
  onboarding_completed?: boolean;
  hearts_updated_at?: string;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  profileLoading: boolean;
  profileError: string | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initializing: true,
  profileLoading: false,
  profileError: null,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
    if (!session) {
      set({ profile: null, profileError: null });
    }
  },

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async () => {
    const user = get().user;
    if (!user) {
      set({ profile: null, profileLoading: false, profileError: null });
      return;
    }

    set({ profileLoading: true, profileError: null });

    const maxRetries = 2;
    let attempt = 0;
    let fetchedData: UserProfile | null = null;
    let fetchErrorMessage: string | null = null;

    while (attempt <= maxRetries) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          fetchErrorMessage = error.message;
        } else if (data) {
          fetchedData = data as UserProfile;
          break;
        } else {
          // Profile row not found yet (e.g. trigger running)
          fetchErrorMessage = 'Profile not found';
        }
      } catch (err) {
        fetchErrorMessage = err instanceof Error ? err.message : 'Unknown error';
      }

      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (fetchedData) {
      // Sync hearts in the background if needed
      try {
        const { data: syncedHearts } = await supabase.rpc('sync_user_hearts');
        if (typeof syncedHearts === 'number') {
          fetchedData.hearts = syncedHearts;
        }
      } catch {
        // Non-blocking sync error
      }
      set({ profile: fetchedData, profileLoading: false, profileError: null });
    } else {
      set({ profileLoading: false, profileError: fetchErrorMessage || 'Failed to load profile' });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, profileError: null });
  },
}));
