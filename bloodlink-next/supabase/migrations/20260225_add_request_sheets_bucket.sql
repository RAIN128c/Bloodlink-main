-- Create the public bucket for request sheets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('request_sheets', 'request_sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public reading
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'request_sheets');

-- Policies for authenticated users to insert
CREATE POLICY "Authenticated users can upload request sheets" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'request_sheets' AND auth.role() = 'authenticated'
);

-- Policies for authenticated users to update
CREATE POLICY "Authenticated users can update request sheets" 
ON storage.objects FOR UPDATE 
WITH CHECK (
  bucket_id = 'request_sheets' AND auth.role() = 'authenticated'
);

-- Add pdf url columns to document_signatures table
ALTER TABLE document_signatures ADD COLUMN IF NOT EXISTS document_url TEXT;
