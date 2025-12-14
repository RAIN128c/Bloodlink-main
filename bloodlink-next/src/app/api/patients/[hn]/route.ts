import { NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const { hn } = await params;
        const patient = await PatientService.getPatientByHn(hn);

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
        const { hn } = await params;
        const data = await request.json();
        const { process, history, date, time } = data;

        const success = await PatientService.updatePatientStatus(
            hn,
            process,
            { history, date, time }
        );

        if (success) {
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
        const { hn } = await params;
        const data = await request.json();
        const { gender, age, bloodType, disease, allergies } = data;

        const success = await PatientService.updatePatient(hn, {
            gender,
            age,
            bloodType,
            disease,
            allergies
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
        const { hn } = await params;
        console.log(`[API DELETE] Attempting to delete patient HN: ${hn}`);
        const success = await PatientService.deletePatient(hn);
        console.log(`[API DELETE] Result for HN ${hn}: ${success ? 'Success' : 'Failed'}`);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            console.warn(`[API DELETE] Failed to delete patient HN: ${hn}`);
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
