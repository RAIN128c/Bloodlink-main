import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Permissions } from '@/lib/permissions';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Doctors, Nurses, or Admins can approve
        if (!Permissions.isDoctorOrNurse(session.user.role) && !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Doctor, Nurse, or Admin only' }, { status: 403 });
        }

        const { hn } = await params;
        const body = await request.json();
        const { resultId } = body;

        if (!resultId) {
            return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
        }

        // Update the lab result with the approver's name
        const approverName = session.user.name || session.user.email;

        const { error } = await supabaseAdmin
            .from('lab_results')
            .update({
                approver_name: approverName,
                updated_at: new Date().toISOString()
            })
            .eq('id', resultId)
            .eq('hn', hn);

        if (error) {
            console.error('Approval error:', error);
            return NextResponse.json({ error: 'Failed to approve result' }, { status: 500 });
        }

        // Update patient process to approved/completed
        await supabaseAdmin
            .from('patients')
            .update({ process: 'อนุมัติแล้ว', updated_at: new Date().toISOString() })
            .eq('hn', hn);

        return NextResponse.json({ success: true, approverName });

    } catch (error) {
        console.error('Approve API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
