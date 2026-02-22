import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';
import { auth } from '@/auth';

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
            const filtered = patients.filter((p: any) => pendingStatuses.includes(p.process));
            return NextResponse.json({
                patients: filtered.map((p: any) => ({
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
                    responsibleEmails: p.responsibleEmails,
                    creatorEmail: p.creatorEmail
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
