-- Add missing columns to lab_results table
ALTER TABLE lab_results 
ADD COLUMN IF NOT EXISTS nrbc text,
ADD COLUMN IF NOT EXISTS nrbc_note text,
ADD COLUMN IF NOT EXISTS platelet_smear text,
ADD COLUMN IF NOT EXISTS platelet_smear_note text,
ADD COLUMN IF NOT EXISTS rbc_morphology text,
ADD COLUMN IF NOT EXISTS rbc_morphology_note text;
