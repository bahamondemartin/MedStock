-- Fix infinite recursion in family RLS policies.
--
-- The original family_members_read policy queried med_family_members from
-- within itself, causing PostgreSQL to raise an infinite recursion error.
-- That error silently propagated into med_stock_items UPDATE checks,
-- blocking stock deductions even for the medication owner.
--
-- Fix: introduce a SECURITY DEFINER function that reads med_family_members
-- without applying RLS, then rewrite every policy that accessed the
-- members table to call this function instead.

CREATE OR REPLACE FUNCTION get_family_id_for_user(p_user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM med_family_members WHERE user_id = p_user_id LIMIT 1
$$;

-- med_families: non-recursive read check
DROP POLICY IF EXISTS "family_read" ON med_families;
CREATE POLICY "family_read" ON med_families
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id = get_family_id_for_user(auth.uid())
  );

-- med_family_members: allow seeing all rows of your own family
DROP POLICY IF EXISTS "family_members_read" ON med_family_members;
CREATE POLICY "family_members_read" ON med_family_members
  FOR SELECT USING (
    family_id = get_family_id_for_user(auth.uid())
  );

-- med_medications: family cross-read via function (no RLS chain)
DROP POLICY IF EXISTS "medications_family_read" ON med_medications;
CREATE POLICY "medications_family_read" ON med_medications
  FOR SELECT USING (
    user_id <> auth.uid()
    AND get_family_id_for_user(auth.uid()) IS NOT NULL
    AND get_family_id_for_user(user_id) = get_family_id_for_user(auth.uid())
  );
