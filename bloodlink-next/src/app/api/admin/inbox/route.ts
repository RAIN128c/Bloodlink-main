import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';
import { Permissions } from '@/lib/permissions';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }
        const { data, error } = await supabase
            .from('admin_inbox')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Inbox fetch error:', error);
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({ messages: data || [] });
    } catch (error) {
        console.error('Inbox API error:', error);
        return NextResponse.json({ messages: [] });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, sender_email, sender_name, subject, message, tags } = body;

        const { error } = await supabase
            .from('admin_inbox')
            .insert([{
                type: type || 'notification',
                sender_email,
                sender_name,
                subject,
                message,
                tags: tags || []
            }]);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Inbox POST error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const { id, is_read } = await request.json();

        const { error } = await supabase
            .from('admin_inbox')
            .update({ is_read, read_at: is_read ? new Date().toISOString() : null })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ success: false }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
