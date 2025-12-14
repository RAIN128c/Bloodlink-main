
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
