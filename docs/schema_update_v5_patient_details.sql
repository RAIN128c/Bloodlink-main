-- Add new columns for patient details (Print Summary support)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS id_card text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS relative_name text,
ADD COLUMN IF NOT EXISTS relative_phone text,
ADD COLUMN IF NOT EXISTS relative_relationship text;

-- Add comments
COMMENT ON COLUMN patients.id_card IS 'Citizen ID Card Number';
COMMENT ON COLUMN patients.phone IS 'Patient Contact Number';
COMMENT ON COLUMN patients.relative_name IS 'Name of Relative/Contact Person';
COMMENT ON COLUMN patients.relative_phone IS 'Relative Contact Number';
COMMENT ON COLUMN patients.relative_relationship IS 'Relationship with Patient';
