import { NextResponse } from 'next/server';
import { LabService } from '@/lib/services/labService';
import { PatientService } from '@/lib/services/patientService';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ hn: string }> }
) {
    try {
        const { hn } = await params;

        // Get patient info
        const patient = await PatientService.getPatientByHn(hn);
        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        // Get lab results
        const labResults = await LabService.getLabResults(hn);

        return NextResponse.json({
            patient,
            labResults
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
        const { hn } = await params;
        const body = await request.json();
        const { notify = false, ...updateData } = body;

        // TODO: Add server-side RBAC check here
        // const session = await auth();
        // if (!Permissions.canEditLab(session?.user?.role)) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        // }

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

