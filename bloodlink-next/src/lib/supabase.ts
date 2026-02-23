import { createClient as createServerSupabaseClient } from '@supabase/supabase-js';
import { createClient as createBrowserSupabaseClient } from '@/utils/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create the Service Role client for server-side usage
export const supabaseAdmin = supabaseServiceKey
    ? createServerSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
    : null;

// Dynamic proxy client: 
// 1. In the browser, it uses the SSR-aware client which automatically attaches the user's session cookie.
// 2. On the server, it falls back to the Service Role key to bypass RLS, because `src/lib/services` 
//    methods do not currently accept a request context.
export const supabase = typeof window !== 'undefined'
    ? createBrowserSupabaseClient()
    : (supabaseAdmin || createServerSupabaseClient(supabaseUrl, supabaseKey));
