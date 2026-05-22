-- Family members can read prescriptions from others in the same family.
-- Uses the existing get_family_id_for_user() function (migration 004).

CREATE POLICY "prescriptions_family_read" ON med_prescriptions
  FOR SELECT USING (
    get_family_id_for_user(user_id) IS NOT NULL
    AND get_family_id_for_user(user_id) = get_family_id_for_user(auth.uid())
  );
