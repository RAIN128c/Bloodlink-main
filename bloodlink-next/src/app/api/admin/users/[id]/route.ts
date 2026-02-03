
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Support both English and Thai admin role names
        const adminRoles = ['admin', 'ผู้ดูแล', 'ผู้ดูแลระบบ'];
        if (!adminRoles.includes(session.user.role || '')) {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { id } = await params;
        console.log(`[API] Fetching user id: ${id}`);
        const user = await AuthService.getUserById(id);
        console.log(`[API] Result for ${id}:`, user ? 'Found' : 'Not Found');

        if (user) {
            // Calculate sequential staff number
            const staffNumber = await AuthService.getStaffNumber(user.userId || '', user.role || '');
            return NextResponse.json({ ...user, staffNumber });
        } else {
            console.warn(`[API] User not found for id: ${id}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Get user API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Support both English and Thai admin role names
        const adminRoles = ['admin', 'ผู้ดูแล', 'ผู้ดูแลระบบ'];
        if (!session?.user || !adminRoles.includes(session.user.role || '')) {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { id } = await params;
        const success = await AuthService.deleteUser(id);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 400 });
        }
    } catch (error) {
        console.error('Delete user API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // Support both English and Thai admin role names
        const adminRoles = ['admin', 'ผู้ดูแล', 'ผู้ดูแลระบบ'];
        if (!session?.user || !adminRoles.includes(session.user.role || '')) {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { role, position, bio, status } = body;

        let success = false;

        // If status update requested
        if (status) {
            success = await AuthService.updateUserStatus(id, status);
        } else {
            // Normal role/bio update
            success = await AuthService.updateUserRole(id, role, position, bio);
        }

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Failed to update user' }, { status: 400 });
        }
    } catch (error) {
        console.error('Update user API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
