-- ============================================================
-- Bloodlink-Next: Complete Supabase Database Schema
-- Version: 2.0.0 (Verified against codebase 2026-02-19)
--
-- PURPOSE: Works for BOTH scenarios:
--   1) Fresh clone: Creates all tables from scratch
--   2) Update existing: Safely adds missing columns/indexes
--
-- TABLES: 12 total + 1 storage bucket
-- VERIFIED: Every column cross-referenced against actual code
-- IMPORTANT: Run this in Supabase SQL Editor — fully idempotent
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (Staff & Admin accounts)
-- Source: authService.ts
-- DB cols: id, email, password, name, surname, role, position,
--          phone, status, bio, avatar_url, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    surname TEXT,
    role TEXT NOT NULL,
    position TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    status TEXT DEFAULT 'รอตรวจสอบ',
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS surname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'รอตรวจสอบ';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================
-- 2. PATIENTS (Patient records)
-- Source: patientService.ts, bulk-import/route.ts
-- DB cols: hn, name, surname, gender, age, blood_type, disease,
--          medication, allergies, allergy, ncd, latest_receipt,
--          test_type, status, process, appointment_date, caregiver,
--          last_check, creator_email, id_card, phone, relative_name,
--          relative_phone, relative_relationship, weight, height,
--          waist, bp, pulse, temperature, dtx, creatinine, egfr,
--          uric_acid, sodium, potassium, chloride, co2,
--          created_at, updated_at, timestamp
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    hn VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    blood_type TEXT,
    disease TEXT DEFAULT '-',
    medication TEXT DEFAULT '-',
    allergies TEXT DEFAULT '-',
    allergy TEXT DEFAULT '-',               -- Used by bulk-import
    ncd TEXT DEFAULT '-',                   -- Used by bulk-import
    latest_receipt TEXT DEFAULT '',
    test_type TEXT DEFAULT 'ตรวจสุขภาพ',
    status TEXT DEFAULT 'ใช้งาน',
    process TEXT DEFAULT 'รอตรวจ',
    appointment_date TIMESTAMPTZ,
    caregiver TEXT DEFAULT '',
    last_check TEXT,                        -- Used by bulk-import
    creator_email TEXT,                     -- Used by bulk-import
    -- Contact Info
    id_card TEXT,
    phone TEXT,
    relative_name TEXT,
    relative_phone TEXT,
    relative_relationship TEXT,
    -- Vital Signs (patient-level)
    weight TEXT,
    height TEXT,
    waist TEXT,
    bp TEXT,
    pulse TEXT,
    temperature TEXT,
    dtx TEXT,
    -- Kidney Function (patient-level)
    creatinine TEXT,
    egfr TEXT,
    uric_acid TEXT,
    -- Electrolytes (patient-level)
    sodium TEXT,
    potassium TEXT,
    chloride TEXT,
    co2 TEXT,
    -- Timestamps
    timestamp TIMESTAMPTZ,                  -- Legacy/secondary timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS disease TEXT DEFAULT '-';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medication TEXT DEFAULT '-';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT '-';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergy TEXT DEFAULT '-';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ncd TEXT DEFAULT '-';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS latest_receipt TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'ตรวจสุขภาพ';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ใช้งาน';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS process TEXT DEFAULT 'รอตรวจ';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS caregiver TEXT DEFAULT '';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_check TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS creator_email TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS id_card TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS relative_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS relative_phone TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS relative_relationship TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS waist TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bp TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS pulse TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS temperature TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dtx TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS creatinine TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS egfr TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS uric_acid TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sodium TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS potassium TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS chloride TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS co2 TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_patients_process ON patients(process);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- ============================================================
-- 3. PATIENT_RESPONSIBILITY (Staff-Patient junction)
-- Source: patientService.ts
-- DB cols: id, patient_hn, user_email, role, is_active,
--          assigned_by, assigned_at
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_responsibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_hn VARCHAR(50) NOT NULL REFERENCES patients(hn) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    role TEXT DEFAULT 'responsible',
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE patient_responsibility ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'responsible';
ALTER TABLE patient_responsibility ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE patient_responsibility ADD COLUMN IF NOT EXISTS assigned_by TEXT;
ALTER TABLE patient_responsibility ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_patient_resp_hn ON patient_responsibility(patient_hn);
CREATE INDEX IF NOT EXISTS idx_patient_resp_email ON patient_responsibility(user_email);

-- ============================================================
-- 4. LAB_RESULTS (Lab test results per patient per visit)
-- Source: labService.ts (addLabResult inserts snake_case,
--         getLabHistory reads snake_case → maps to camelCase)
-- ALL DB COLUMNS ARE SNAKE_CASE
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_results (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    hn VARCHAR(50) NOT NULL REFERENCES patients(hn) ON DELETE CASCADE,
    patient_name TEXT,                      -- snake_case in DB
    -- Request Form
    doctor_name TEXT,
    department TEXT,
    diagnosis TEXT,
    clinical_history TEXT,
    specimen_type TEXT,
    -- Location & Visit
    ward TEXT,
    bed TEXT,
    visit_type TEXT,
    receive_by TEXT,
    approver_name TEXT,
    -- CBC (Complete Blood Count)
    wbc TEXT, wbc_note TEXT,
    rbc TEXT, rbc_note TEXT,
    hb TEXT, hb_note TEXT,
    hct TEXT, hct_note TEXT,
    mcv TEXT, mcv_note TEXT,
    mch TEXT, mch_note TEXT,
    mchc TEXT, mchc_note TEXT,
    plt TEXT, plt_note TEXT,
    -- Differential Count
    neutrophil TEXT, neutrophil_note TEXT,
    lymphocyte TEXT, lymphocyte_note TEXT,
    monocyte TEXT, monocyte_note TEXT,
    eosinophil TEXT, eosinophil_note TEXT,
    basophil TEXT, basophil_note TEXT,
    -- Smear & Morphology
    platelet_smear TEXT, platelet_smear_note TEXT,
    nrbc TEXT, nrbc_note TEXT,
    rbc_morphology TEXT, rbc_morphology_note TEXT,
    -- Vital Signs & Physical (SNAKE_CASE)
    weight NUMERIC,
    height NUMERIC,
    waist_line NUMERIC,                     -- NOT "waistLine"
    bmi NUMERIC,
    bp_sys NUMERIC,                         -- NOT "bpSys"
    bp_dia NUMERIC,                         -- NOT "bpDia"
    pulse NUMERIC,
    respiration NUMERIC,
    temperature NUMERIC,
    -- Chemistry
    fbs NUMERIC, fbs_note TEXT,
    uric_acid NUMERIC,                      -- NOT "uricAcid"
    ast NUMERIC,
    alt NUMERIC,
    cholesterol NUMERIC,
    triglyceride NUMERIC,
    hdl NUMERIC,
    ldl NUMERIC,
    -- Kidney Function
    creatinine NUMERIC,
    egfr NUMERIC,
    -- Electrolytes
    sodium NUMERIC,
    potassium NUMERIC,
    chloride NUMERIC,
    co2 NUMERIC,
    -- Urine (SNAKE_CASE)
    urine_albumin TEXT,                     -- NOT "urineAlbumin"
    urine_sugar TEXT,                       -- NOT "urineSugar"
    specimen_status TEXT,                   -- NOT "specimenStatus"
    -- Audit
    reporter_name TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist (covers migration gaps)
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS clinical_history TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS specimen_type TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS bed TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS visit_type TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS receive_by TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS approver_name TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS wbc TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS wbc_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS rbc TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS rbc_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS hb TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS hb_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS hct TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS hct_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mcv TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mcv_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mch TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mch_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mchc TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS mchc_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS plt TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS plt_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS neutrophil TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS neutrophil_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS lymphocyte TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS lymphocyte_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS monocyte TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS monocyte_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS eosinophil TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS eosinophil_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS basophil TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS basophil_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS platelet_smear TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS platelet_smear_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS nrbc TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS nrbc_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS rbc_morphology TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS rbc_morphology_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS waist_line NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS bmi NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS bp_sys NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS bp_dia NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS pulse NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS respiration NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS temperature NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS fbs NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS fbs_note TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS uric_acid NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS ast NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS alt NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS cholesterol NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS triglyceride NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS hdl NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS ldl NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS creatinine NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS egfr NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS sodium NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS potassium NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS chloride NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS co2 NUMERIC;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS urine_albumin TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS urine_sugar TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS specimen_status TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS reporter_name TEXT;
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_lab_results_hn ON lab_results(hn);
CREATE INDEX IF NOT EXISTS idx_lab_results_timestamp ON lab_results(timestamp DESC);

-- ============================================================
-- 5. LAB_REFERENCE_RANGES (Normal ranges for lab tests)
-- Source: settings/lab-ranges/route.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_reference_ranges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_key TEXT UNIQUE NOT NULL,
    test_name TEXT NOT NULL,
    min_value NUMERIC,
    max_value NUMERIC,
    unit TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lab_reference_ranges ADD COLUMN IF NOT EXISTS min_value NUMERIC;
ALTER TABLE lab_reference_ranges ADD COLUMN IF NOT EXISTS max_value NUMERIC;
ALTER TABLE lab_reference_ranges ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE lab_reference_ranges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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

-- ============================================================
-- 6. APPOINTMENTS
-- Source: appointmentService.ts
-- CRITICAL: Actual DB uses title/start_time/end_time/description
-- NOT appointment_date/type/note!
-- DB cols: id (uuid), patient_hn, title, start_time, end_time,
--          description, status, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_hn VARCHAR(50) NOT NULL REFERENCES patients(hn) ON DELETE CASCADE,
    title TEXT,                             -- Maps to "type" in app
    start_time TIMESTAMPTZ,                 -- Maps to appointment_date + time
    end_time TIMESTAMPTZ,                   -- Null = pending, set = completed
    description TEXT,                       -- Maps to "note" in app
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_appointments_patient_hn ON appointments(patient_hn);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);

-- ============================================================
-- 7. MESSAGES (User-to-user messaging)
-- Source: messageService.ts
-- DB cols: id, sender_id, receiver_id, subject, content,
--          type, is_read, created_at
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject TEXT,
    content TEXT,
    type TEXT DEFAULT 'message',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'message';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================
-- 8. ADMIN_INBOX (Admin notifications & messages)
-- Source: admin/inbox/route.ts, admin/reports/route.ts
-- DB cols: id, type, sender_email, sender_name, subject,
--          message, tags[], is_read, read_at, created_at
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_inbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT DEFAULT 'notification',
    sender_email TEXT,
    sender_name TEXT,
    subject TEXT,
    message TEXT,
    tags TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'notification';
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE admin_inbox ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_admin_inbox_created ON admin_inbox(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_inbox_is_read ON admin_inbox(is_read);

-- ============================================================
-- 9. NOTIFICATIONS (System notification store)
-- Note: Exists in Supabase but NOT queried via .from() in code
-- Kept for compatibility
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- 10. STATUS_HISTORY (Patient status change tracking)
-- Source: statusHistoryService.ts
-- DB cols: id, patient_hn, from_status, to_status,
--          changed_by_email, changed_by_name, changed_by_role,
--          note, created_at
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_hn VARCHAR NOT NULL REFERENCES patients(hn) ON DELETE CASCADE,
    from_status VARCHAR NOT NULL,
    to_status VARCHAR NOT NULL,
    changed_by_email VARCHAR NOT NULL,
    changed_by_name VARCHAR,
    changed_by_role VARCHAR,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE status_history ADD COLUMN IF NOT EXISTS changed_by_name VARCHAR;
ALTER TABLE status_history ADD COLUMN IF NOT EXISTS changed_by_role VARCHAR;
ALTER TABLE status_history ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE status_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_status_history_hn ON status_history(patient_hn);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at DESC);

-- ============================================================
-- 11. AUDIT_LOGS (Login & action tracking)
-- Source: authService.ts, statsService.ts, admin/reports/route.ts
-- DB cols: id, user_email, name, role, position, action,
--          details, target, created_at
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    name TEXT,
    role TEXT,
    position TEXT,
    action TEXT NOT NULL,
    details TEXT,                            -- Action details
    target TEXT,                             -- Target entity
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- 12. USER_TOKENS (Password reset tokens)
-- Source: lib/actions/auth.ts
-- DB cols: id, email, token, type, expires_at, created_at
-- ============================================================
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'password_reset',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'password_reset';
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_tokens_email ON user_tokens(email);
CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_tokens(token);

-- ============================================================
-- 13. STORAGE: Avatar Bucket
-- Source: upload/route.ts, 20260219_fix_storage_policy.sql
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;


-- ############################################################
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ############################################################

-- ---- USERS ----
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data') THEN
        CREATE POLICY "Users can read own data"
        ON users FOR SELECT TO authenticated
        USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- ---- PATIENTS ----
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Authenticated users can read patients') THEN
        CREATE POLICY "Authenticated users can read patients"
        ON patients FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Authenticated users can insert patients') THEN
        CREATE POLICY "Authenticated users can insert patients"
        ON patients FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Authenticated users can update patients') THEN
        CREATE POLICY "Authenticated users can update patients"
        ON patients FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Authenticated users can delete patients') THEN
        CREATE POLICY "Authenticated users can delete patients"
        ON patients FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ---- PATIENT_RESPONSIBILITY ----
ALTER TABLE patient_responsibility ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_responsibility' AND policyname = 'Authenticated can read responsibility') THEN
        CREATE POLICY "Authenticated can read responsibility"
        ON patient_responsibility FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_responsibility' AND policyname = 'Authenticated can insert responsibility') THEN
        CREATE POLICY "Authenticated can insert responsibility"
        ON patient_responsibility FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_responsibility' AND policyname = 'Authenticated can update responsibility') THEN
        CREATE POLICY "Authenticated can update responsibility"
        ON patient_responsibility FOR UPDATE TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patient_responsibility' AND policyname = 'Authenticated can delete responsibility') THEN
        CREATE POLICY "Authenticated can delete responsibility"
        ON patient_responsibility FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ---- LAB_RESULTS ----
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_results' AND policyname = 'Authenticated users can read lab results') THEN
        CREATE POLICY "Authenticated users can read lab results"
        ON lab_results FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_results' AND policyname = 'Authenticated users can insert lab results') THEN
        CREATE POLICY "Authenticated users can insert lab results"
        ON lab_results FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_results' AND policyname = 'Authenticated users can update lab results') THEN
        CREATE POLICY "Authenticated users can update lab results"
        ON lab_results FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

-- ---- LAB_REFERENCE_RANGES ----
ALTER TABLE lab_reference_ranges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_reference_ranges' AND policyname = 'Allow read access for all authenticated users') THEN
        CREATE POLICY "Allow read access for all authenticated users" ON lab_reference_ranges
        FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lab_reference_ranges' AND policyname = 'Allow write access for authenticated users') THEN
        CREATE POLICY "Allow write access for authenticated users" ON lab_reference_ranges
        FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- ---- APPOINTMENTS ----
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Allow authenticated read') THEN
        CREATE POLICY "Allow authenticated read" ON appointments
        FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Allow authenticated insert') THEN
        CREATE POLICY "Allow authenticated insert" ON appointments
        FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Allow authenticated update') THEN
        CREATE POLICY "Allow authenticated update" ON appointments
        FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Allow authenticated delete') THEN
        CREATE POLICY "Allow authenticated delete" ON appointments
        FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- ---- MESSAGES ----
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view received messages') THEN
        CREATE POLICY "Users can view received messages" ON messages
        FOR SELECT USING (auth.uid() = receiver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view sent messages') THEN
        CREATE POLICY "Users can view sent messages" ON messages
        FOR SELECT USING (auth.uid() = sender_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages') THEN
        CREATE POLICY "Users can send messages" ON messages
        FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update read status') THEN
        CREATE POLICY "Users can update read status" ON messages
        FOR UPDATE USING (auth.uid() = receiver_id);
    END IF;
END $$;

-- ---- ADMIN_INBOX (no RLS — accessed via supabaseAdmin) ----
-- ---- NOTIFICATIONS (no RLS — not queried in code) ----

-- ---- STATUS_HISTORY ----
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Users can insert status history') THEN
        CREATE POLICY "Users can insert status history" ON status_history
        FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'status_history' AND policyname = 'Users can read status history') THEN
        CREATE POLICY "Users can read status history" ON status_history
        FOR SELECT USING (true);
    END IF;
END $$;

-- ---- AUDIT_LOGS ----
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can insert audit logs') THEN
        CREATE POLICY "Users can insert audit logs" ON audit_logs
        FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can read audit logs') THEN
        CREATE POLICY "Users can read audit logs" ON audit_logs
        FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- ---- USER_TOKENS ----
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
-- Accessed via supabaseAdmin only — no RLS policies needed

-- ---- STORAGE POLICIES ----
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- TABLE COMMENTS
-- ============================================================
COMMENT ON TABLE users IS 'Staff & admin accounts (bcrypt passwords)';
COMMENT ON TABLE patients IS 'Patient records with workflow tracking';
COMMENT ON TABLE patient_responsibility IS 'Staff-patient assignment junction';
COMMENT ON TABLE lab_results IS 'Lab results (CBC, chemistry, vitals) — ALL snake_case columns';
COMMENT ON TABLE lab_reference_ranges IS 'Normal reference ranges for lab tests';
COMMENT ON TABLE appointments IS 'Appointments — uses title/start_time/end_time/description NOT appointment_date/type/note';
COMMENT ON TABLE messages IS 'User-to-user messaging & system notifications';
COMMENT ON TABLE admin_inbox IS 'Admin-only inbox for system notifications';
COMMENT ON TABLE notifications IS 'System notification store (not queried in code)';
COMMENT ON TABLE status_history IS 'Patient status change audit trail';
COMMENT ON TABLE audit_logs IS 'Login & action audit trail';
COMMENT ON TABLE user_tokens IS 'Password reset tokens';

-- ============================================================
-- Done! 12 tables + 1 storage bucket + RLS policies.
-- Every column verified against actual codebase.
-- ============================================================
