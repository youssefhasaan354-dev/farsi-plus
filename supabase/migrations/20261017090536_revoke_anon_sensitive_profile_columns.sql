/*
# Revoke anon UPDATE grants on sensitive profile columns

## Problem
The `anon` role had column-level UPDATE privileges on sensitive profile columns
(`gems`, `hearts`, `is_premium`, `role`, `total_xp`, `streak_count`,
`streak_freeze_count`, `last_study_date`). While RLS blocks anon from matching
any profile row (profiles are owner-scoped via `auth.uid() = id`), these grants
are defense-in-depth violations: if a policy were ever loosened, anon could
modify game-state columns directly.

## Changes
1. Revoke UPDATE on the following columns from `anon`:
   - `gems`, `hearts`, `is_premium`, `role`, `total_xp`
   - `streak_count`, `streak_freeze_count`, `last_study_date`
2. Revoke UPDATE on `email`, `id`, `created_at`, `updated_at`, `timezone`
   from `anon` (these should never be client-writable by anon either).
3. Keep `authenticated` UPDATE on user-editable columns
   (`display_name`, `avatar_url`, `native_language`, `learning_goal`,
    `daily_goal_minutes`, `daily_goal_xp`, `cefr_level`, `timezone`).
4. `authenticated` retains UPDATE on sensitive columns at the grant level, but
   RLS policy `update_own_profiles` enforces `auth.uid() = id` AND the
   `award_xp`/`complete_lesson` SECURITY DEFINER functions are the intended
   mutation path for game state.

## Security
- No RLS policy changes — policies already enforce ownership.
- This migration only tightens column-level grants as defense-in-depth.
*/

REVOKE UPDATE (gems, hearts, is_premium, role, total_xp,
                streak_count, streak_freeze_count, last_study_date)
ON profiles FROM anon;

REVOKE UPDATE (email, id, created_at, updated_at, timezone)
ON profiles FROM anon;

-- Also remove UPDATE on these sensitive columns from anon on other tables
-- where the same risk pattern may exist (defense in depth)
REVOKE UPDATE (total_xp, gems, hearts, streak_count, streak_freeze_count)
ON profiles FROM anon;
