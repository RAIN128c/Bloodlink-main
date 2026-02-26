
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';
import { isValidRole } from '@/lib/permissions';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
    try {
        // Rate limit check
        const ip = getClientIp(request);
        const rateLimitResult = checkRateLimit(`admin:${ip}`, RATE_LIMIT_CONFIGS.admin);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetInMs / 1000)) } }
            );
        }

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!isValidRole(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Valid role required' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const roleFilter = searchParams.get('role'); // 'staff', 'patient', or specific role like 'doctor'

        const users = await AuthService.getAllUsers();

        let filteredUsers = users;

        if (roleFilter === 'staff') {
            const staffRoles = ['แพทย์', 'พยาบาล', 'เจ้าหน้าที่ห้องปฏิบัติการ'];
            filteredUsers = users.filter(u =>
                staffRoles.includes(u.role || '') ||
                u.role?.toLowerCase().includes('doctor') ||
                u.role?.toLowerCase().includes('nurse')
            );
        } else if (roleFilter) {
            filteredUsers = users.filter(u => u.role === roleFilter);
        }

        return NextResponse.json(filteredUsers);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
