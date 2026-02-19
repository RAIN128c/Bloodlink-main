
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { StatsService } from '@/lib/services/statsService';
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

        const stats = await StatsService.getDashboardStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
