-- Appointments Table for Tracking Appointment History
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_hn VARCHAR(50) NOT NULL REFERENCES patients(hn) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'no_show')),
    type VARCHAR(50) DEFAULT 'follow_up',
    note TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by patient
CREATE INDEX IF NOT EXISTS idx_appointments_patient_hn ON appointments(patient_hn);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read all appointments
CREATE POLICY "Allow authenticated read" ON appointments
    FOR SELECT
    TO authenticated
    USING (true);

-- Create a policy that allows authenticated users to insert appointments
CREATE POLICY "Allow authenticated insert" ON appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create a policy that allows authenticated users to update appointments
CREATE POLICY "Allow authenticated update" ON appointments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
