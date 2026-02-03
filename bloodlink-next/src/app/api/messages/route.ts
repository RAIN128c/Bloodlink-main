import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MessageService } from '@/lib/services/messageService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        console.log('POST /api/messages - Session:', JSON.stringify(session, null, 2));

        if (!session?.user?.userId) {
            console.error('POST /api/messages - Unauthorized: Missing userId');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('POST /api/messages - Body:', JSON.stringify(body, null, 2));

        const { receiverId, content, subject, type } = body;

        if (!receiverId || !content) {
            console.error('POST /api/messages - Missing required fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`POST /api/messages - Sending message from ${session.user.userId} to ${receiverId}`);

        const result = await MessageService.sendMessage(
            session.user.userId,
            receiverId,
            content,
            subject,
            type
        );

        console.log('POST /api/messages - Service Result:', result);

        if (!result.success) {
            console.error('POST /api/messages - Service Error:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST /api/messages - Internal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
