ALTER TABLE med_prescriptions ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]';

UPDATE med_prescriptions
SET medications = jsonb_build_array(
  jsonb_build_object(
    'medication_id', medication_id,
    'medication_name', medication_name,
    'dose', COALESCE(dose, '')
  )
)
WHERE medication_name IS NOT NULL
  AND (medications IS NULL OR jsonb_array_length(medications) = 0);
