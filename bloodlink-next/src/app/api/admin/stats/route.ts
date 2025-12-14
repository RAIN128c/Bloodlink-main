
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { StatsService } from '@/lib/services/statsService';

export async function GET() {
    try {
        const session = await auth();
        // Allow any authenticated user (role check can be added later if needed)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stats = await StatsService.getDashboardStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
