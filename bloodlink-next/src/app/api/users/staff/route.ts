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

        // Fetch ALL users and filter loosely for active/approved status
        // This prevents DB query restrictions from hiding users with slightly different role/status strings
        const allUsers = await AuthService.getAllUsers();

        const validStatuses = ['approved', 'อนุมัติ', 'ผ่าน', 'ใช้งาน', 'active'];
        const staff = allUsers.filter(u =>
            u.status && validStatuses.some(s => u.status?.toLowerCase().includes(s.toLowerCase()))
        );

        return NextResponse.json({ staff });
    } catch (error) {
        console.error('Staff search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
