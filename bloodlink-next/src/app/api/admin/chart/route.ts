import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { StatsService } from '@/lib/services/statsService';
import { Permissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const scope = searchParams.get('scope') as 'hour' | 'day' | 'week' | 'month' | 'year' || 'month';

        const validScopes = ['hour', 'day', 'week', 'month', 'year'];
        if (!validScopes.includes(scope)) {
            return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
        }

        const chartData = await StatsService.getChartDataByScope(scope);
        return NextResponse.json({ chartData, scope });
    } catch (error) {
        console.error('Chart data error:', error);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}
