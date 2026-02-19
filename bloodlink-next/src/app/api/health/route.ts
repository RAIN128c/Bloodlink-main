import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Check Supabase database connectivity with a lightweight query
        const { error } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('Health check - DB connection failed:', error.message);
            return new NextResponse('Database connection failed', { status: 503 });
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Health check error:', error);
        return new NextResponse('Service unavailable', { status: 503 });
    }
}
