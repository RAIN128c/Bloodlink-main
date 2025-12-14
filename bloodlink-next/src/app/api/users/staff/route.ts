import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';
import { Role } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Doctors and Nurses
        const staff = await AuthService.getUsersByRoles([Role.DOCTOR, Role.NURSE]);

        return NextResponse.json({ staff });
    } catch (error) {
        console.error('Staff search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
