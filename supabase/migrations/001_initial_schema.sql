-- MedStock initial schema

-- Medications catalog
CREATE TABLE medications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT CHECK (category IN ('analgésico','antibiótico','antiácido','antihistamínico','otro')),
  unit         TEXT NOT NULL DEFAULT 'comprimidos'
                 CHECK (unit IN ('comprimidos','cápsulas','ml','sobres','unidades')),
  min_stock    INTEGER DEFAULT 5,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Individual stock lots (one medication can have several boxes with different expiry dates)
CREATE TABLE stock_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id   UUID REFERENCES medications(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL CHECK (quantity >= 0),
  expiry_date     DATE,
  purchase_date   DATE DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Consumption log for FEFO tracking
CREATE TABLE consumption_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID REFERENCES medications(id) ON DELETE CASCADE,
  quantity_used  INTEGER NOT NULL CHECK (quantity_used > 0),
  date           DATE DEFAULT CURRENT_DATE,
  reason         TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Generated alerts (to track sends and avoid duplicates)
CREATE TABLE alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID REFERENCES medications(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('expiry','low_stock','out_of_stock')),
  severity       TEXT NOT NULL CHECK (severity IN ('critical','warning','info')),
  trigger_date   DATE NOT NULL,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on medications
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Dashboard summary view
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
FROM medications m
LEFT JOIN stock_items s ON s.medication_id = m.id
GROUP BY m.id;

-- Row Level Security
ALTER TABLE medications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_medications" ON medications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_stock" ON stock_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM medications WHERE id = medication_id AND user_id = auth.uid())
  );

CREATE POLICY "user_owns_consumption_log" ON consumption_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM medications WHERE id = medication_id AND user_id = auth.uid())
  );

CREATE POLICY "user_owns_alerts" ON alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM medications WHERE id = medication_id AND user_id = auth.uid())
  );
