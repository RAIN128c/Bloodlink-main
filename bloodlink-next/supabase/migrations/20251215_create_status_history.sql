-- Migration: Create status_history table for tracking patient status changes
-- Created: 2025-12-15

-- Create status_history table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_history_hn ON status_history(patient_hn);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at DESC);

-- Enable RLS
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to insert status history
CREATE POLICY "Users can insert status history" ON status_history
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read status history
CREATE POLICY "Users can read status history" ON status_history
    FOR SELECT USING (true);

-- Comment on table
COMMENT ON TABLE status_history IS 'Tracks all patient status changes with who made the change and when';
