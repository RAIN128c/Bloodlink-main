import { NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';

export async function GET() {
    try {
        const patients = await PatientService.getPatients();
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
