import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notificationService';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/status
 * Send status notification to responsible staff
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { patientHn, status, patientName, customSubject, customMessage } = body;

        if (!patientHn || !status || !patientName) {
            return NextResponse.json(
                { error: 'Missing required fields: patientHn, status, patientName' },
                { status: 400 }
            );
        }

        const result = await NotificationService.sendStatusNotification(
            patientHn,
            status,
            patientName,
            customSubject,
            customMessage
        );
        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Status notification API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
