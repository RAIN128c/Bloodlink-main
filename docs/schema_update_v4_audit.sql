-- Add Audit Trail related fields to lab_results table
ALTER TABLE lab_results 
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;

-- Comment on columns
COMMENT ON COLUMN lab_results.reporter_name IS 'Name of the Medical Technologist who reported result';
COMMENT ON COLUMN lab_results.reported_at IS 'Timestamp when the result was finalized/reported';
