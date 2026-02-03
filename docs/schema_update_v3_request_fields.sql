-- Add Request Form related fields to lab_results table
ALTER TABLE lab_results 
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS clinical_history TEXT,
ADD COLUMN IF NOT EXISTS specimen_type TEXT;

-- Comment on columns for clarity
COMMENT ON COLUMN lab_results.doctor_name IS 'Name of the ordering physician';
COMMENT ON COLUMN lab_results.department IS 'Ward or Department (e.g. OPD, ER, IPD)';
COMMENT ON COLUMN lab_results.diagnosis IS 'Provisional diagnosis or ICD-10';
COMMENT ON COLUMN lab_results.clinical_history IS 'Brief clinical history';
COMMENT ON COLUMN lab_results.specimen_type IS 'Type of specimen (e.g. Blood, Urine)';
