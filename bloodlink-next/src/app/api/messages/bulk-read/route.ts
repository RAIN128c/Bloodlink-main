import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MessageService } from '@/lib/services/messageService';

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { messageIds, is_read } = body;

        if (!Array.isArray(messageIds) || typeof is_read !== 'boolean') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const result = await MessageService.markBulkAsRead(messageIds, is_read);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
