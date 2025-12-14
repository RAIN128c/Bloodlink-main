import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Optional: Check for admin role
                    // Note: Role check in middleware is tricky if token doesn't have it yet or needs decryption.
                    // Ideally handled in Layout or Page, but basic check here is good if token has it.
                    // For now, simpler to leave role check to Page level (Server Component) to avoid Edge issues with complex auth logic.
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
