import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuthService } from '@/lib/services/authService';

/**
 * Search users by email (for adding responsible persons)
 * GET /api/users/search?email=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email')?.toLowerCase();

        if (!email) {
            return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
        }

        // Search for user by exact email match
        const user = await AuthService.getUserByEmail(email);

        if (user) {
            return NextResponse.json({
                found: true,
                user: {
                    userId: user.userId,
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    position: user.position,
                    role: user.role
                }
            });
        } else {
            return NextResponse.json({ found: false });
        }
    } catch (error) {
        console.error('User search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
