'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export type SessionPayload = {
    user: {
        id: string;
        userId: string;
        name: string;
        surname: string;
        email: string;
        role: string;
        status: string;
    } | null;
} | null;

type SessionContextType = {
    data: SessionPayload;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    update: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SessionPayload>(null);
    const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
    const supabase = createClient();

    const updateSession = async (user: User | null) => {
        if (!user) {
            setData(null);
            setAuthStatus('unauthenticated');
            return;
        }

        try {
            // Fetch comprehensive public profile (since JWT may not have full custom claims yet)
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setData({
                    user: {
                        id: user.id,
                        userId: user.id,
                        name: profile.name,
                        surname: profile.surname,
                        email: user.email || '',
                        role: profile.role,
                        status: profile.status
                    }
                });
                setAuthStatus('authenticated');
            } else {
                setData(null);
                setAuthStatus('unauthenticated');
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setData(null);
            setAuthStatus('unauthenticated');
        }
    };

    useEffect(() => {
        // Initial Fetch
        supabase.auth.getUser().then(({ data: { user } }) => {
            updateSession(user);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setData(null);
                setAuthStatus('unauthenticated');
            } else if (session?.user) {
                updateSession(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <SessionContext.Provider value={{ data, status: authStatus, update: async () => { } }}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * A wrapper mimicking `useSession()` from next-auth/react
 */
export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SupabaseAuthProvider');
    }
    return context;
}

/**
 * A wrapper mimicking `signOut()` from next-auth/react
 */
export async function signOut({ callbackUrl = '/login' } = {}) {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = callbackUrl;
}
