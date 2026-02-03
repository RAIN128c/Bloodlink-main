import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { AuthService } from '@/lib/services/authService';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    trustHost: true, // Fix for Vercel behind proxy
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Call our existing AuthService
                const user = await AuthService.authenticateUser(
                    credentials.email as string,
                    credentials.password as string
                );

                if (!user) {
                    return null; // Return null if auth fails
                }

                // Return user object compatible with NextAuth
                return {
                    id: user.userId || user.email, // NextAuth requires id
                    userId: user.userId,
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    role: user.role, // Custom property (needs type augmentation)
                };
            },
        }),
    ],
    pages: {
        signIn: '/login', // Custom login page
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // console.log('JWT Callback - User:', user); // DEBUG
                token.role = (user as any).role;
                token.status = (user as any).status;
                token.userId = (user as any).userId;
                token.surname = (user as any).surname;
            }
            return token;
        },
        async session({ session, token }) {
            // console.log('Session Callback - Token:', token); // DEBUG
            if (session.user) {
                // Ensure manual mapping matches the types we defined
                session.user.role = token.role as string;
                session.user.userId = token.userId as string;
                session.user.surname = token.surname as string;
                session.user.status = token.status as string; // Add status mapping
            }
            return session;
        }
    }
});
