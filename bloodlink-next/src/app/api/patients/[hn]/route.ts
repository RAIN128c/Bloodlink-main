import { NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';
import { MessageService } from '@/lib/services/messageService';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;
        const decodedHn = decodeURIComponent(hn);

        // Use Admin client to bypass RLS policies that might block the API (Anon)
        // while relying on the session check above for security.
        const patient = await PatientService.getPatientByHn(decodedHn, supabaseAdmin || undefined);

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patient' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;
        const data = await request.json();
        const { process, history, date, time } = data;

        // Security Check: Status Transition
        const oldPatient = await PatientService.getPatientByHn(decodeURIComponent(hn), supabaseAdmin || undefined);
        const currentStatus = oldPatient?.process || 'รอตรวจ';
        const userRole = session.user.role;

        const isAllowed = Permissions.canUpdateToStatus(userRole, currentStatus, process);

        if (!isAllowed) {
            return NextResponse.json(
                { error: 'ไม่มีสิทธิ์เปลี่ยนสถานะนี้ หรือข้ามขั้นตอนการทำงาน' },
                { status: 403 }
            );
        }

        // Assign Lab Admin responsibility on 'รับออร์เดอร์' (Accept Request)
        if (process === 'รอจัดส่ง' && currentStatus === 'รอแล็บรับเรื่อง' && session.user.email) {
            // Using PatientService's built-in responsibility assignment methods mapped to the patient_responsibility join table.
            await PatientService.addResponsiblePerson(hn, session.user.email, session.user.email);
        }

        const success = await PatientService.updatePatientStatus(
            hn,
            process,
            { history, date, time }
        );

        if (success) {
            // Send Lab Notification if status changed to 'รอแล็บรับเรื่อง' (Wait for Lab Acceptance)
            if (process === 'รอแล็บรับเรื่อง' && currentStatus !== 'รอแล็บรับเรื่อง') {
                // Directly insert into admin_inbox since MessageService.sendMessage targets the 'messages' table.
                const patientName = `${oldPatient?.name || ''} ${oldPatient?.surname || ''}`.trim();
                await supabaseAdmin?.from('admin_inbox').insert({
                    type: 'lab_request',
                    subject: `คำขอส่งตรวจแล็บใหม่: ${patientName} (HN: ${oldPatient?.hn})`,
                    message: `ผู้ป่วย ${patientName} ได้รับคำสั่งเจาะเลือดแล้ว กรุณาตรวจสอบความถูกต้องและกดยืนยันรับ Request ก่อนที่ รพ.สต. จะเริ่มจัดส่ง`,
                    sender_name: session.user.name || 'System',
                    sender_email: session.user.email,
                    is_read: false
                });
            }

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to update patient' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to update patient' },
            { status: 500 }
        );
    }
}

// PATCH: Update patient data fields (gender, age, bloodType, disease, allergies)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;
        const data = await request.json();
        const { gender, age, bloodType, disease, allergies, idCard, phone, relativeName, relativePhone, relativeRelationship } = data;

        const success = await PatientService.updatePatient(hn, {
            gender,
            age,
            bloodType,
            disease,
            allergies,
            idCard,
            phone,
            relativeName,
            relativePhone,
            relativeRelationship
        });

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to update patient data' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to update patient data' },
            { status: 500 }
        );
    }
}
// DELETE: Delete patient
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;
        const success = await PatientService.deletePatient(hn);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { error: 'Failed to delete patient' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('[API DELETE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete patient' },
            { status: 500 }
        );
    }
}
