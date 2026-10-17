/*
# Clear needs_review flag on seeded content

## Problem
181 content rows (lessons, exercises, vocabulary) had needs_review=true even
though they are seeded content from a verified source. This causes them to
show up in the admin review queue unnecessarily and blocks them from being
published if the app filters on needs_review.

## Changes
1. Set needs_review=false on all lessons where source='seed'
2. Set needs_review=false on all exercises where source='seed'
3. Set needs_review=false on all vocabulary where source='seed'

## Notes
- Only touches rows with source='seed' — user-submitted content keeps its flag.
- No data loss — only a boolean flag is flipped.
*/

UPDATE lessons SET needs_review = false, updated_at = now()
WHERE needs_review = true AND source = 'seed';

UPDATE exercises SET needs_review = false, updated_at = now()
WHERE needs_review = true AND source = 'seed';

UPDATE vocabulary SET needs_review = false, updated_at = now()
WHERE needs_review = true AND source = 'seed';
