-- Store the member's email in the family members table for display purposes
ALTER TABLE med_family_members ADD COLUMN IF NOT EXISTS email TEXT;
