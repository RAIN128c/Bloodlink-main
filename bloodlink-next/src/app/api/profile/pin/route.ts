import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { newPin } = data;

        if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
            return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง กรุณาระบุรหัส PIN 6 หลัก' }, { status: 400 });
        }

        // Fetch user from public.users to get their ID to update pin_hash
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', session.user.email.toLowerCase())
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้ในระบบ' }, { status: 404 });
        }

        // Hash the new PIN
        const pinHash = await bcrypt.hash(newPin, 10);

        // Update PIN in DB
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to update PIN:', updateError);
            return NextResponse.json({ error: 'ไม่สามารถบันทึกรหัส PIN ได้' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        console.error('API Error in PIN Setup');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Check if user already has a PIN
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('pin_hash')
            .eq('email', session.user.email.toLowerCase())
            .single();

        if (error) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ hasPin: !!user?.pin_hash });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
