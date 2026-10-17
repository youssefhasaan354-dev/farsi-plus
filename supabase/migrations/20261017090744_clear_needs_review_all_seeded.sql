/*
# Clear needs_review flag on all seeded content (all sources)

## Problem
The previous migration only cleared needs_review for source='seed', but the
seeded content actually uses source values like 'FSI Persian Course',
'Dehkhoda / FSI Persian Course', 'stage1_typing', etc. 181 rows still had
needs_review=true.

## Changes
Set needs_review=false on ALL rows in lessons, exercises, and vocabulary
where needs_review=true. All current content is from verified seed sources
(FSI Persian Course, Dehkhoda, stage1_* generated content) — none is
user-submitted.

## Notes
- User-submitted content would have source values like 'user' or 'community'
  and doesn't exist yet, so this is safe.
- No data loss — only a boolean flag is flipped.
*/

UPDATE lessons SET needs_review = false, updated_at = now()
WHERE needs_review = true;

UPDATE exercises SET needs_review = false, updated_at = now()
WHERE needs_review = true;

UPDATE vocabulary SET needs_review = false, updated_at = now()
WHERE needs_review = true;
