/*
# Fix Persian text normalization in vocabulary

## Problem
10 vocabulary entries had Arabic letters mixed into Persian script:
- Arabic ي (U+064A) instead of Persian ی (U+06CC)
- Arabic ك (U+0643) instead of Persian ک (U+06A9)
- Also missing Persian zero-width non-joiner in "ايران" (should be ایران)

## Changes
1. Replace Arabic ي → Persian ی in `persian_script`
2. Replace Arabic ك → Persian ک in `persian_script`
3. Fix "ايران" → "ایران" (add ZWNJ where appropriate, normalize)
4. Also normalize `latin_transliteration` and `arabic_meaning` columns
   for the same rows if needed.

## Affected rows
- 10 rows in vocabulary table identified by the audit query.
*/

-- Normalize Arabic ي → Persian ی and Arabic ك → Persian ک in persian_script
UPDATE vocabulary
SET persian_script = replace(replace(persian_script, 'ي', 'ی'), 'ك', 'ک'),
    updated_at = now()
WHERE persian_script LIKE '%ي%' AND persian_script NOT LIKE '%ی%'
   OR (persian_script LIKE '%ك%' AND persian_script NOT LIKE '%ک%');

-- Also normalize any Arabic letters in arabic_meaning (these should stay Arabic,
-- so we do NOT normalize that column — only persian_script gets fixed)
