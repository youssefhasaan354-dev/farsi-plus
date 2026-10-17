/*
# Lock down anon profile column privileges (defense in depth)

## Problem
The previous migration revoked column-level UPDATE grants, but anon still had
UPDATE because a table-level `GRANT ALL` on profiles superseded the column-level
revokes. Column-level grants only RESTRICT a table-level grant; they do not
override a table-level GRANT. The fix is to revoke the table-level UPDATE
grant from anon entirely, then grant back UPDATE only on the user-editable
columns anon actually needs (none — anon never updates profiles in this app
since profiles are owner-scoped and require auth).

## Changes
1. `REVOKE UPDATE ON profiles FROM anon;` — removes the table-level grant.
2. Do NOT grant any column-level UPDATE back to anon — anon has no business
   updating profiles. RLS already blocks anon from matching any row, and
   removing the grant closes the gap if a policy is ever loosened.
3. `authenticated` keeps its existing table-level UPDATE grant (unchanged).
   RLS policy `update_own_profiles` still enforces `auth.uid() = id`.

## Security
- Defense in depth: anon can no longer UPDATE profiles at the grant level.
- No RLS changes — ownership enforcement is unchanged.
- No impact on authenticated users — their grants are untouched.
*/

REVOKE UPDATE ON profiles FROM anon;
