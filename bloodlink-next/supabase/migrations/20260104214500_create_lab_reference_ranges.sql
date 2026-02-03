-- Create lab_reference_ranges table
CREATE TABLE IF NOT EXISTS lab_reference_ranges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    test_key text UNIQUE NOT NULL,
    test_name text NOT NULL,
    min_value numeric,
    max_value numeric,
    unit text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Seed default values
INSERT INTO lab_reference_ranges (test_key, test_name, unit, min_value, max_value) VALUES
('wbc', 'WBC', '10*3/μ', 4.23, 9.07),
('rbc', 'RBC', '10*6/μL', 4.63, 6.08),
('hb', 'Hemoglobin', 'g/dL', 13.7, 17.5),
('hct', 'Hematocrit', '%', 40.1, 51),
('mcv', 'MCV', 'fL', 79, 92.2),
('mch', 'MCH', 'pg', 25.7, 32.2),
('mchc', 'MCHC', 'g/dL', 32.3, 36.5),
('plt', 'Platelet count', '10*3/μL', 140, 400),
('neutrophil', 'Neutrophil', '%', 34, 67.9),
('lymphocyte', 'Lymphocyte', '%', 21.8, 53.1),
('monocyte', 'Monocyte', '%', 5.3, 12.2),
('eosinophil', 'Eosinophil', '%', 0.8, 7),
('basophil', 'Basophil', '%', 0.2, 1.2),
('plateletSmear', 'Platelet from smear', '', NULL, NULL),
('nrbc', 'NRBC (cell/100 WBC)', 'cell/100 WBC', NULL, NULL),
('rbcMorphology', 'RBC Morphology', '', NULL, NULL)
ON CONFLICT (test_key) DO NOTHING;

-- Enable RLS
ALTER TABLE lab_reference_ranges ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authed)
CREATE POLICY "Allow read access for all authenticated users" ON lab_reference_ranges
    FOR SELECT TO authenticated USING (true);

-- Allow update access to Lab Staff and Admins (using role based check in app logic, but DB policy can be open or strict)
-- For simplicity and relying on app-level permissions for detailed role checks (since Supabase role claims might vary)
-- We will allow write to authenticated users, but the API will enforce the specific role.
CREATE POLICY "Allow write access for authenticated users" ON lab_reference_ranges
    FOR ALL TO authenticated USING (true);
