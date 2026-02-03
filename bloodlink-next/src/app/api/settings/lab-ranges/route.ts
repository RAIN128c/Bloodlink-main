import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Use admin client if available to bypass RLS (server-side fetch)
        // Fallback to anon client (which might fail if RLS blocks anon)
        const db = supabaseAdmin || supabase;

        const { data, error } = await db
            .from('lab_reference_ranges')
            .select('*')
            .order('test_name');

        if (error) {
            console.error('API Error: Failed to fetch lab ranges:', error);
            // Check for specific error codes like '42P01' (undefined_table)
            if (error.code === '42P01') {
                return NextResponse.json({ error: 'Table not found. Please run the migration.' }, { status: 500 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, min_value, max_value, unit } = body;

        // Note: In a real production app with RLS, using the static service client might bypass RLS 
        // if not handled carefully, or 'supabase' here is the anon client which honours RLS if you set the session.
        // For this project structure we are reusing the initialized client. 
        // If we needed auth context we would need to pass the access token to supabase-js.
        // Given existing project pattern, we will use the global client (or admin if available).
        const db = supabaseAdmin || supabase;

        const { data, error } = await db
            .from('lab_reference_ranges')
            .update({
                min_value: min_value === '' ? null : min_value,
                max_value: max_value === '' ? null : max_value,
                unit,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating range:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
