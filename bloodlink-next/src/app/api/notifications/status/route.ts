import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notificationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/status
 * Send status notification to responsible staff
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patientHn, status, patientName, customSubject, customMessage } = body;

        if (!patientHn || !status || !patientName) {
            return NextResponse.json(
                { error: 'Missing required fields: patientHn, status, patientName' },
                { status: 400 }
            );
        }

        console.log('Notification API called:', { patientHn, status, patientName, customSubject, customMessage });

        const result = await NotificationService.sendStatusNotification(
            patientHn,
            status,
            patientName,
            customSubject,
            customMessage
        );

        console.log('Notification result:', result);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Status notification API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
