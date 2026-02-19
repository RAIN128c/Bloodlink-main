import { NextResponse } from 'next/server';
import { LabService } from '@/lib/services/labService';
import { PatientService } from '@/lib/services/patientService';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { hn } = await params;

        // Get patient info
        const patient = await PatientService.getPatientByHn(hn);
        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        // Get lab results history (all results for this HN)
        const labHistory = await LabService.getLabHistory(hn);

        return NextResponse.json({
            patient,
            results: labHistory
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lab results' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.canEditLab(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Lab staff or Admin only' }, { status: 403 });
        }

        const { hn } = await params;
        const body = await request.json();
        const { notify = false, ...updateData } = body;

        const result = await LabService.updateLabResult(hn, updateData, notify);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to update lab results' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to update lab results' },
            { status: 500 }
        );
    }
}

