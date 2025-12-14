import { NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';

export async function GET() {
    try {
        const patients = await PatientService.getPatients();
        return NextResponse.json({ success: true, count: patients.length, data: patients.slice(0, 5) });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch patients' }, { status: 500 });
    }
}
