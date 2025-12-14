import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MessageService } from '@/lib/services/messageService';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const result = await MessageService.deleteMessage(id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/messages/[id] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Toggle read status based on body
        if (body.is_read === false) {
            const result = await MessageService.markAsUnread(id);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 500 });
            }
        } else {
            const result = await MessageService.markAsRead(id);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH /api/messages/[id] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
