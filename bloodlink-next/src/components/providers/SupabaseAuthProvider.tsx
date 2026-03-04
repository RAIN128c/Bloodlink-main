'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

export type SessionPayload = {
    user: {
        id: string
        userId: string
        name: string
        surname: string
        email: string
        role: string
        status: string
    } | null
} | null

type SessionContextType = {
    data: SessionPayload
    status: 'loading' | 'authenticated' | 'unauthenticated'
    update: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SessionPayload>(null)
    const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
    const signingOut = useRef(false)
    const supabase = createClient()

    const updateSession = async (user: User | null) => {
        // Prevent re-entry while signing out a deleted user
        if (signingOut.current) return

        if (!user) {
            setData(null)
            setAuthStatus('unauthenticated')
            return
        }

        try {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

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
                })
                setAuthStatus('authenticated')
            } else {
                // User profile was deleted by admin — sign out and redirect with reason
                signingOut.current = true
                await supabase.auth.signOut()
                setData(null)
                setAuthStatus('unauthenticated')
                window.location.href = '/login?reason=account_removed'
            }
        } catch {
            // On error, sign out to prevent stuck state
            signingOut.current = true
            await supabase.auth.signOut()
            setData(null)
            setAuthStatus('unauthenticated')
            window.location.href = '/login?reason=account_removed'
        }
    }

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            // Fast initial load using local session
            const { data: { session }, error } = await supabase.auth.getSession()

            if (!mounted) return

            if (error || !session?.user) {
                setData(null)
                setAuthStatus('unauthenticated')
                return
            }

            // Only fetch profile if not signing out
            if (!signingOut.current) {
                await updateSession(session.user)
            }
        }

        initializeAuth()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return

            if (event === 'SIGNED_OUT') {
                setData(null)
                setAuthStatus('unauthenticated')
            } else if (session?.user && !signingOut.current && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
                // Ensure we only update if signed in, preventing double INITIAL_SESSION fires if possible
                updateSession(session.user)
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase])

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
