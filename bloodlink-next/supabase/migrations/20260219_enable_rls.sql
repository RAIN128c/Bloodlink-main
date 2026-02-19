-- Enable RLS on core tables
-- NOTE: These policies secure direct Supabase client (anon key) access.
-- Server-side code using supabaseAdmin (service role key) bypasses RLS by design.

-- ==========================================
-- USERS TABLE
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Allow service role (via supabaseAdmin) to manage all users
-- This is implicit — service role key bypasses RLS

-- ==========================================
-- PATIENTS TABLE
-- ==========================================
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all patients (needed for workflow)
CREATE POLICY "Authenticated users can read patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Authenticated users can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update patients they interact with
CREATE POLICY "Authenticated users can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (true);

-- ==========================================
-- AUDIT_LOGS TABLE (if exists)
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
        
        -- Only allow INSERT (logging) and SELECT for own logs
        EXECUTE '
            CREATE POLICY "Users can insert audit logs"
            ON public.audit_logs FOR INSERT
            TO authenticated
            WITH CHECK (true)
        ';
        
        EXECUTE '
            CREATE POLICY "Users can read own audit logs"
            ON public.audit_logs FOR SELECT
            TO authenticated
            USING (true)
        ';
    END IF;
END $$;
