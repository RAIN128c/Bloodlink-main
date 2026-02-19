import { NextResponse } from 'next/server';
import { PatientService } from '@/lib/services/patientService';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const patients = await PatientService.getPatients();
        return NextResponse.json({ success: true, count: patients.length, data: patients.slice(0, 5) });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch patients' }, { status: 500 });
    }
}
