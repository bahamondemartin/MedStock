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
    WHEN MIN(s.expiry_date) FILTER (WHERE s.expiry_date IS NOT NULL AND s.quantity > 0) <= CURRENT_DATE + 60 THEN 'soon'
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
