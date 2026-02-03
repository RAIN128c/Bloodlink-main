-- Complete Seed based on User's Request
-- Run this in Supabase SQL Editor to populate/update the lab-settings page

-- CBC
INSERT INTO lab_reference_ranges (test_key, test_name, min_value, max_value, unit) VALUES
('wbc', 'WBC', 4.3, 9.07, '10^3/uL'),
('rbc', 'RBC', 4.63, 6.08, '10^6/uL'),
('hb', 'Hemoglobin', 13.7, 17.5, 'g/dL'),
('hct', 'Hematocrit', 40.1, 51, '%'),
('mcv', 'MCV', 79, 92.2, 'fL'),
('mch', 'MCH', 25.7, 32.2, 'pg'),
('mchc', 'MCHC', 32.3, 36.5, 'g/dL'),
('plt', 'Platelet count', 140, 400, '10^3/uL'),
('neutrophil', 'Neutrophil', 34, 67.9, '%'),
('lymphocyte', 'Lymphocyte', 21.8, 53.1, '%'),
('monocyte', 'Monocyte', 5.3, 12.2, '%'),
('eosinophil', 'Eosinophil', 0.8, 7, '%'),
('basophil', 'Basophil', 0.2, 1.2, '%'),
('plateletSmear', 'Platelet from smear', NULL, NULL, ''),
('nrbc', 'NRBC', NULL, NULL, 'cell/100 WBC'),
('rbcMorphology', 'RBC Morphology', NULL, NULL, '')
ON CONFLICT (test_key) DO UPDATE SET
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    unit = EXCLUDED.unit;

-- Clinical Chemistry
INSERT INTO lab_reference_ranges (test_key, test_name, min_value, max_value, unit) VALUES
('fbs', 'FBS', 70, 100, 'mg/dL'),
('uricAcid', 'Uric Acid', 2.4, 6, 'mg/dL'),
('ast', 'AST (SGOT)', 0, 40, 'U/L'),
('alt', 'ALT (SGPT)', 0, 41, 'U/L'),
('cholesterol', 'Cholesterol', 0, 200, 'mg/dL'),
('triglyceride', 'Triglyceride', 0, 150, 'mg/dL'),
('hdl', 'HDL-C', 40, 60, 'mg/dL'),
('ldl', 'LDL-C', 0, 100, 'mg/dL')
ON CONFLICT (test_key) DO UPDATE SET
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    unit = EXCLUDED.unit;

-- Urinalysis
INSERT INTO lab_reference_ranges (test_key, test_name, min_value, max_value, unit) VALUES
('urineAlbumin', 'Urine Albumin', NULL, NULL, ''),
('urineSugar', 'Urine Sugar', NULL, NULL, '')
ON CONFLICT (test_key) DO NOTHING;
