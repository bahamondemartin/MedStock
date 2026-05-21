ALTER TABLE med_families ADD COLUMN IF NOT EXISTS join_code TEXT;

UPDATE med_families
SET join_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE join_code IS NULL;

ALTER TABLE med_families
  ALTER COLUMN join_code SET DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'med_families_join_code_key'
      AND conrelid = 'med_families'::regclass
  ) THEN
    ALTER TABLE med_families ADD CONSTRAINT med_families_join_code_key UNIQUE (join_code);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'family_join_lookup' AND tablename = 'med_families'
  ) THEN
    EXECUTE 'CREATE POLICY "family_join_lookup" ON med_families FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;
