CREATE TABLE IF NOT EXISTS med_shopping_pins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES med_medications(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, medication_id)
);

ALTER TABLE med_shopping_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pins_user" ON med_shopping_pins
  FOR ALL USING (user_id = auth.uid());
