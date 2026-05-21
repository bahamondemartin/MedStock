ALTER TABLE med_medications ADD COLUMN IF NOT EXISTS is_pediatric BOOLEAN DEFAULT false;

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
  m.is_pediatric,
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

CREATE TABLE IF NOT EXISTS med_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES med_medications(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  schedule_times TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE med_prescriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'prescriptions_user' AND tablename = 'med_prescriptions'
  ) THEN
    EXECUTE 'CREATE POLICY "prescriptions_user" ON med_prescriptions FOR ALL USING (user_id = auth.uid())';
  END IF;
END $$;
