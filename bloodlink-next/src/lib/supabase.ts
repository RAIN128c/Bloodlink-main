import { createClient } from '@supabase/supabase-js';

// Fallback to dummy values to prevent build errors during static analysis if env vars are missing.
// The app will still fail at runtime if these are not provided.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
