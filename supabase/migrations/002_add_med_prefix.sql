-- Add Med_ prefix to all MedStock tables for multi-app database

-- Drop view that references the tables (will recreate after rename)
DROP VIEW IF EXISTS v_medication_summary;

-- Drop RLS policies before renaming tables
DROP POLICY IF EXISTS "user_owns_medications" ON medications;
DROP POLICY IF EXISTS "user_owns_stock" ON stock_items;
DROP POLICY IF EXISTS "user_owns_consumption_log" ON consumption_log;
DROP POLICY IF EXISTS "user_owns_alerts" ON alerts;

-- Rename tables
ALTER TABLE medications RENAME TO Med_medications;
ALTER TABLE stock_items RENAME TO Med_stock_items;
ALTER TABLE consumption_log RENAME TO Med_consumption_log;
ALTER TABLE alerts RENAME TO Med_alerts;

-- Rename trigger (if it exists)
ALTER TRIGGER medications_updated_at ON Med_medications RENAME TO Med_medications_updated_at;

-- Recreate the view with updated table references
CREATE VIEW v_medication_summary AS
SELECT
  m.id,
  m.user_id,
  m.name,
  m.category,
  m.unit,
  m.min_stock,
  COALESCE(SUM(s.quantity), 0)                                                       AS total_stock,
  MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0)     AS next_expiry,
  CASE
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) < CURRENT_DATE
      THEN 'expired'
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) <= CURRENT_DATE + 7
      THEN 'critical'
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) <= CURRENT_DATE + 30
      THEN 'warning'
    ELSE 'ok'
  END AS expiry_status,
  CASE
    WHEN COALESCE(SUM(s.quantity), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(s.quantity), 0) <= m.min_stock THEN 'low_stock'
    ELSE 'ok'
  END AS stock_status
FROM Med_medications m
LEFT JOIN Med_stock_items s ON s.medication_id = m.id
GROUP BY m.id;

-- Recreate RLS policies with new table names
ALTER TABLE Med_medications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE Med_stock_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE Med_consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE Med_alerts         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_medications" ON Med_medications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_stock" ON Med_stock_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM Med_medications WHERE id = medication_id AND user_id = auth.uid())
  );

CREATE POLICY "user_owns_consumption_log" ON Med_consumption_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM Med_medications WHERE id = medication_id AND user_id = auth.uid())
  );

CREATE POLICY "user_owns_alerts" ON Med_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM Med_medications WHERE id = medication_id AND user_id = auth.uid())
  );

-- Update foreign key constraints to reference renamed tables
ALTER TABLE Med_stock_items
  DROP CONSTRAINT IF EXISTS stock_items_medication_id_fkey,
  ADD CONSTRAINT Med_stock_items_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES Med_medications(id) ON DELETE CASCADE;

ALTER TABLE Med_consumption_log
  DROP CONSTRAINT IF EXISTS consumption_log_medication_id_fkey,
  ADD CONSTRAINT Med_consumption_log_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES Med_medications(id) ON DELETE CASCADE;

ALTER TABLE Med_alerts
  DROP CONSTRAINT IF EXISTS alerts_medication_id_fkey,
  ADD CONSTRAINT Med_alerts_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES Med_medications(id) ON DELETE CASCADE;
