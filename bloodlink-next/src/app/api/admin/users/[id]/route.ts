
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';
import { Permissions } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
        }

        const { id } = await params;
        const user = await AuthService.getUserById(id);

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
        if (!session?.user || !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
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
        if (!session?.user || !Permissions.isAdmin(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
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
