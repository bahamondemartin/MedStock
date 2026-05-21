-- Replace email-based invites with a join code on the family

ALTER TABLE med_families
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE
    DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

-- Backfill any existing families that got NULL
UPDATE med_families
SET join_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE join_code IS NULL;

-- Allow any authenticated user to look up a family by join_code (needed for joining)
CREATE POLICY "family_join_lookup" ON med_families
  FOR SELECT USING (auth.uid() IS NOT NULL);
