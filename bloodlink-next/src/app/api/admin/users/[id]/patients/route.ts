import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';
import { PatientService } from '@/lib/services/patientService';
import { Permissions } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
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
