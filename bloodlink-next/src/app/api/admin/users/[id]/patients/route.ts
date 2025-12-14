import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';
import { PatientService } from '@/lib/services/patientService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Support both English and Thai admin role names
        const adminRoles = ['admin', 'ผู้ดูแล', 'ผู้ดูแลระบบ'];
        if (!session?.user || !adminRoles.includes(session.user.role || '')) {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { id } = await params;

        // Get user email first
        const user = await AuthService.getUserById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get patients this user is responsible for
        const patients = await PatientService.getPatientsByResponsibleUser(user.email);

        return NextResponse.json(patients);
    } catch (error) {
        console.error('Get user patients API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
