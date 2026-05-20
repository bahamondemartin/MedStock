-- MedStock: family/household sharing

CREATE TABLE med_families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE med_family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES med_families(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (family_id, user_id)
);

CREATE TABLE med_family_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES med_families(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  invited_by  UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE med_families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE med_family_invites ENABLE ROW LEVEL SECURITY;

-- Families: owner or member can read
CREATE POLICY "family_read" ON med_families
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM med_family_members WHERE family_id = id AND user_id = auth.uid())
  );

CREATE POLICY "family_insert" ON med_families
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "family_update" ON med_families
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "family_delete" ON med_families
  FOR DELETE USING (owner_id = auth.uid());

-- Members: members of the same family can read
CREATE POLICY "family_members_read" ON med_family_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM med_family_members fm
      WHERE fm.family_id = family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "family_members_insert" ON med_family_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM med_families WHERE id = family_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "family_members_delete" ON med_family_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM med_families WHERE id = family_id AND owner_id = auth.uid())
  );

-- Invites: owner can manage, anyone with token can read
CREATE POLICY "invites_owner" ON med_family_invites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM med_families WHERE id = family_id AND owner_id = auth.uid())
  );

CREATE POLICY "invites_token_read" ON med_family_invites
  FOR SELECT USING (true);

-- Update med_medications RLS so family members can read shared stock
DROP POLICY IF EXISTS "user_owns_medications" ON med_medications;

-- Owner can do everything with their own medications
CREATE POLICY "medications_owner" ON med_medications
  FOR ALL USING (user_id = auth.uid());

-- Family members can read medications of other members in their family
CREATE POLICY "medications_family_read" ON med_medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM med_family_members fm1
      JOIN med_family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
        AND fm2.user_id = med_medications.user_id
        AND fm1.user_id <> fm2.user_id
    )
  );

-- Update v_medication_summary to include family context
DROP VIEW IF EXISTS v_medication_summary;

CREATE VIEW v_medication_summary AS
SELECT
  m.id,
  m.user_id,
  m.name,
  m.category,
  m.unit,
  m.min_stock,
  m.notes,
  COALESCE(SUM(s.quantity), 0) AS total_stock,
  MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) AS next_expiry,
  CASE
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) < CURRENT_DATE THEN 'expired'
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) <= CURRENT_DATE + 7 THEN 'critical'
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) <= CURRENT_DATE + 30 THEN 'warning'
    ELSE 'ok'
  END AS expiry_status,
  CASE
    WHEN COALESCE(SUM(s.quantity), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(s.quantity), 0) <= m.min_stock THEN 'low_stock'
    ELSE 'ok'
  END AS stock_status
FROM med_medications m
LEFT JOIN med_stock_items s ON s.medication_id = m.id
GROUP BY m.id;
