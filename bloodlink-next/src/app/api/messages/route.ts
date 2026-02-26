import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MessageService } from '@/lib/services/messageService';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages, error } = await MessageService.getMessages(session.user.userId);

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json(messages);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const { receiverId, content, subject, type } = body;

        if (!receiverId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await MessageService.sendMessage(
            session.user.userId,
            receiverId,
            content,
            subject,
            type
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST /api/messages - Internal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
