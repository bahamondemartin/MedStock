-- Helper: returns true if the current user shares a family with the given user_id
-- Used to extend RLS on stock/consumption tables for family members.

-- med_stock_items: family members can read, insert, and update stock of shared medications
CREATE POLICY "stock_family_read" ON med_stock_items
  FOR SELECT USING (
    medication_id IN (
      SELECT m.id FROM med_medications m
      JOIN med_family_members fm1 ON fm1.user_id = auth.uid()
      JOIN med_family_members fm2 ON fm2.family_id = fm1.family_id AND fm2.user_id = m.user_id
      WHERE fm1.user_id <> fm2.user_id
    )
  );

CREATE POLICY "stock_family_insert" ON med_stock_items
  FOR INSERT WITH CHECK (
    medication_id IN (
      SELECT m.id FROM med_medications m
      JOIN med_family_members fm1 ON fm1.user_id = auth.uid()
      JOIN med_family_members fm2 ON fm2.family_id = fm1.family_id AND fm2.user_id = m.user_id
      WHERE fm1.user_id <> fm2.user_id
    )
  );

CREATE POLICY "stock_family_update" ON med_stock_items
  FOR UPDATE USING (
    medication_id IN (
      SELECT m.id FROM med_medications m
      JOIN med_family_members fm1 ON fm1.user_id = auth.uid()
      JOIN med_family_members fm2 ON fm2.family_id = fm1.family_id AND fm2.user_id = m.user_id
      WHERE fm1.user_id <> fm2.user_id
    )
  );

-- med_consumption_log: family members can read and insert consumption records
CREATE POLICY "consumption_family_read" ON med_consumption_log
  FOR SELECT USING (
    medication_id IN (
      SELECT m.id FROM med_medications m
      JOIN med_family_members fm1 ON fm1.user_id = auth.uid()
      JOIN med_family_members fm2 ON fm2.family_id = fm1.family_id AND fm2.user_id = m.user_id
      WHERE fm1.user_id <> fm2.user_id
    )
  );

CREATE POLICY "consumption_family_insert" ON med_consumption_log
  FOR INSERT WITH CHECK (
    medication_id IN (
      SELECT m.id FROM med_medications m
      JOIN med_family_members fm1 ON fm1.user_id = auth.uid()
      JOIN med_family_members fm2 ON fm2.family_id = fm1.family_id AND fm2.user_id = m.user_id
      WHERE fm1.user_id <> fm2.user_id
    )
  );
