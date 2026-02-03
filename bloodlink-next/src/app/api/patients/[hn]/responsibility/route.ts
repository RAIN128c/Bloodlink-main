import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PatientService } from '@/lib/services/patientService';
import { Permissions } from '@/lib/permissions';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const { hn } = await params;
        const session = await auth();
        const email = session?.user?.email;
        const role = (session?.user as any)?.role;

        // Get responsible persons
        const responsiblePersons = await PatientService.getResponsiblePersons(hn);

        // Check if current user is responsible
        const isAdmin = Permissions.isAdmin(role);
        const isResponsible = email ? await PatientService.isUserResponsible(hn, email) : false;
        const canEdit = isAdmin || isResponsible;

        return NextResponse.json({
            responsiblePersons,
            isResponsible,
            isAdmin,
            canEdit,
            currentUserEmail: email
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch responsibility data' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const { hn } = await params;
        const session = await auth();
        const email = session?.user?.email;
        const role = (session?.user as any)?.role;

        if (!email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, targetEmail } = await request.json();

        // Admin can do anything
        const isAdmin = Permissions.isAdmin(role);
        const isResponsible = await PatientService.isUserResponsible(hn, email);

        if (!isAdmin && !isResponsible) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (action === 'add') {
            const result = await PatientService.addResponsiblePerson(hn, targetEmail, email);
            return NextResponse.json(result);
        }

        if (action === 'remove') {
            // Non-admins can only remove themselves
            if (!isAdmin && targetEmail !== email) {
                return NextResponse.json({ error: 'Can only remove yourself' }, { status: 403 });
            }
            const success = await PatientService.removeResponsiblePerson(hn, targetEmail);
            return NextResponse.json({ success });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update responsibility' }, { status: 500 });
    }
}
