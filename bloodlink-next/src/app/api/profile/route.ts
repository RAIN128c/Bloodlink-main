import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch fresh user data from DB
        const user = await AuthService.getUserByEmail(session.user.email);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get sequential staff number based on role
        const staffNumber = await AuthService.getStaffNumber(user.userId || '', user.role || '');

        const profile = {
            userId: staffNumber,  // Now using sequential number instead of UUID
            name: user.name || '',
            surname: user.surname || '',
            email: user.email || '',
            position: user.position || '', // Actual edited position
            role: user.role || 'user',     // System role
            roleDisplay: getRoleDisplay(user.role || 'user'),
            status: user.status,
            avatarUrl: user.avatarUrl
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        // Allowed fields to update
        const updateData = {
            name: data.name,
            surname: data.surname,
            phone: data.phone,
            position: data.position,
            avatarUrl: data.avatarUrl
        };

        const success = await AuthService.updateUser(session.user.email, updateData);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function getRoleDisplay(role: string): string {
    const roleMap: Record<string, string> = {
        'admin': 'ผู้ดูแลระบบ',
        'doctor': 'แพทย์',
        'nurse': 'พยาบาล',
        'lab': 'เจ้าหน้าที่แลป',
        'user': 'เจ้าหน้าที่',
    };
    return roleMap[role] || role;
}
