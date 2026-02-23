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

        // Only Doctors, Nurses, or Admins can reject
        if (!Permissions.isDoctorOrNurse(session.user.role) && !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Doctor, Nurse, or Admin only' }, { status: 403 });
        }

        const { hn } = await params;
        const body = await request.json();
        const { resultId, reason } = body;

        if (!resultId) {
            return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
        }

        // Get the result first to delete the file
        const { data: result } = await supabaseAdmin
            .from('lab_results')
            .select('file_url, patient_name')
            .eq('id', resultId)
            .single();

        if (result && result.file_url) {
            await supabaseAdmin.storage.from('lab_reports').remove([result.file_url]);
        }

        // Delete the lab result record
        const { error } = await supabaseAdmin
            .from('lab_results')
            .delete()
            .eq('id', resultId)
            .eq('hn', hn);

        if (error) {
            console.error('Rejection error:', error);
            return NextResponse.json({ error: 'Failed to reject and delete result' }, { status: 500 });
        }

        // Update patient process to "กำลังจัดส่ง" (to be re-uploaded by Lab Staff)
        await supabaseAdmin
            .from('patients')
            .update({ process: 'กำลังจัดส่ง', updated_at: new Date().toISOString() })
            .eq('hn', hn);

        // Optionally send a message to the lab staff about the rejection
        try {
            const { data: creators } = await supabaseAdmin
                .from('patients')
                .select('creator_email')
                .eq('hn', hn)
                .single();

            if (creators && creators.creator_email) {
                const { data: user } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('email', creators.creator_email)
                    .single();

                if (user) {
                    const { data: sender } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('email', session.user.email)
                        .single();

                    await supabaseAdmin.from('messages').insert({
                        sender_id: sender?.id || null,
                        receiver_id: user.id,
                        subject: `ตีกลับผลตรวจเลือด HN: ${hn}`,
                        content: `ผู้ตรวจสอบ (${session.user.name}) ส่งคืนผลตรวจเลือดของผู้ป่วย HN: ${hn} (${result?.patient_name || '-'}) เนื่องจาก: ${reason || 'ข้อมูลไม่ถูกต้อง'}\n\nกรุณาอัปโหลดผลใหม่อีกครั้ง`,
                        type: 'lab_result',
                    });
                }
            }
        } catch (msgErr) {
            console.error('Failed to notify rejection', msgErr);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Reject API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
