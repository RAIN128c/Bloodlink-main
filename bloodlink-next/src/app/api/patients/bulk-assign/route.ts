import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PatientService } from '@/lib/services/patientService';
import { Permissions } from '@/lib/permissions';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { patientHns, staffEmail } = body as { patientHns: string[]; staffEmail: string };

        if (!Array.isArray(patientHns) || patientHns.length === 0) {
            return NextResponse.json({ error: 'No patients provided' }, { status: 400 });
        }

        if (!staffEmail) {
            return NextResponse.json({ error: 'No staff email provided' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0
        };

        const role = (session.user as any)?.role;
        const isAdmin = Permissions.isAdmin(role);

        // Process each patient
        for (const hn of patientHns) {
            try {
                // Security Check: Must be Admin or Responsible for THIS patient
                if (!isAdmin) {
                    const isResponsible = await PatientService.isUserResponsible(hn, session.user.email || '');
                    if (!isResponsible) {
                        results.failed++; // Count as failed due to permission
                        continue;
                    }
                }

                const result = await PatientService.addResponsiblePerson(hn, staffEmail, session.user.email || 'system');

                if (result.success) {
                    results.success++;
                } else {
                    // Might fail if already assigned, count as failed but not error
                    results.failed++;
                }
            } catch (err) {
                results.failed++;
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Bulk assign error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
