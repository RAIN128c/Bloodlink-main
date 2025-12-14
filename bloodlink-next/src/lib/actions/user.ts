'use server';

import { auth } from '@/auth';
import { User } from '@/types';

export interface CurrentUserProfile {
    id: string;
    name: string;
    surname: string;
    email: string;
    position: string;
    role: string;
    avatarUrl?: string;
}

export async function getCurrentUser(): Promise<CurrentUserProfile | null> {
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    // Get user from session - in production you'd fetch full profile from DB
    const user = session.user as User & { role?: string };

    // Parse name (from email or stored name)
    const nameParts = (user.name || user.email?.split('@')[0] || 'User').split(' ');

    return {
        id: user.email || 'unknown',
        name: nameParts[0] || 'User',
        surname: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        position: getRoleDisplay(user.role || 'user'),
        role: user.role || 'user',
        avatarUrl: undefined, // Could fetch from profile storage
    };
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

export async function isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user;
}

export async function isAdmin(): Promise<boolean> {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    return role === 'admin';
}
