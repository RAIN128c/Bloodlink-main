import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';
import { auth } from '@/auth';
import { Patient } from '@/types';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const processFilter = searchParams.get('process');

        const patients = await PatientService.getPatients();

        // Filter for lab queue: patients waiting for lab results
        if (processFilter === 'pending_lab') {
            // Include standard pending statuses + new Lab workflow states
            const pendingStatuses = ['รอแล็บรับเรื่อง', 'รอจัดส่ง', 'กำลังจัดส่ง', 'กำลังตรวจ'];
            const filtered = patients.filter((p: Patient) => p.process && pendingStatuses.includes(p.process));

            // Fetch the true 'sender' (who changed status to รอแล็บรับเรื่อง)
            // and the true 'receiver' (who changed status to กำลังตรวจ)
            // by querying status_history for these specific patients.
            const hns = filtered.map((p: Patient) => p.hn);

            // Create a mapping of HN -> { senderName, receiverName }
            const historyMap: Record<string, { sender?: string, receiver?: string, latestSenderTime?: number, latestReceiverTime?: number }> = {};

            // Only query status_history if we have patients to look up
            if (hns.length > 0) {
                try {
                    const { data: historyData } = await import('@/lib/supabase').then(m => m.supabase
                        .from('status_history')
                        .select('patient_hn, to_status, changed_by_name, created_at')
                        .in('patient_hn', hns)
                        .in('to_status', ['รอแล็บรับเรื่อง', 'กำลังตรวจ'])
                    );

                    if (historyData) {
                        for (const h of historyData) {
                            const hn = h.patient_hn;
                            if (!historyMap[hn]) historyMap[hn] = {};

                            const time = new Date(h.created_at).getTime();
                            const name = h.changed_by_name || 'ไม่ทราบชื่อ';

                            if (h.to_status === 'รอแล็บรับเรื่อง') {
                                if (!historyMap[hn].latestSenderTime || time > historyMap[hn].latestSenderTime!) {
                                    historyMap[hn].sender = name;
                                    historyMap[hn].latestSenderTime = time;
                                }
                            } else if (h.to_status === 'กำลังตรวจ') {
                                if (!historyMap[hn].latestReceiverTime || time > historyMap[hn].latestReceiverTime!) {
                                    historyMap[hn].receiver = name;
                                    historyMap[hn].latestReceiverTime = time;
                                }
                            }
                        }
                    }
                } catch (historyErr) {
                    console.error('[pending_lab] Error fetching status history:', historyErr);
                }
            }


            return NextResponse.json({
                patients: filtered.map((p: Patient) => ({
                    hn: p.hn,
                    name: p.name,
                    surname: p.surname,
                    process: p.process,
                    testType: p.testType,
                    updatedAt: p.timestamp,
                    caregiver: p.caregiver,
                    // Additional fields required for PrintSummarySheet
                    gender: p.gender,
                    age: p.age,
                    bloodType: p.bloodType,
                    disease: p.disease,
                    allergies: p.allergies,
                    idCard: p.idCard,
                    phone: p.phone,
                    relativeName: p.relativeName,
                    relativePhone: p.relativePhone,
                    relativeRelationship: p.relativeRelationship,
                    // IMPORTANT: Keep actual responsibleEmails from the patient data (responsibility table)
                    // This is what drives "My Tasks" filtering. Do NOT override with history names.
                    responsibleEmails: p.responsibleEmails || [],
                    creatorEmail: p.creatorEmail,
                    // History-derived display names (for UI labels, not for task filtering)
                    senderName: historyMap[p.hn]?.sender || null,
                    receiverName: historyMap[p.hn]?.receiver || null,
                }))
            });
        }

        return NextResponse.json(patients);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patients' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const result = await PatientService.addPatient(data);

        if (result.success) {
            return NextResponse.json({ success: true }, { status: 201 });
        } else {
            return NextResponse.json(
                { error: result.error || 'Failed to add patient' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to add patient' },
            { status: 500 }
        );
    }
}
