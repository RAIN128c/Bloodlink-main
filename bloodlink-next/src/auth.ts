import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

/**
 * A wrapper function mimicking NextAuth's `auth()` to minimize codebase changes.
 * Returns a NextAuth-compatible session object constructed from Supabase auth state.
 * Wrapped with React.cache() to deduplicate calls within a single server request.
 */
export const auth = cache(async () => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    // Fetch custom profile data from public.users table
    // This allows existing components to continue using session.user.role, etc.
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Fallback if public profile isn't generated yet
        return {
            user: {
                id: user.id,
                userId: user.id,
                email: user.email,
                name: 'Unknown',
                surname: 'User',
                role: 'user',
                status: 'active'
            }
        }
    }

    // Return NextAuth-compatible standard format
    return {
        user: {
            id: user.id,
            userId: user.id, // Keep for backwards compatibility
            email: user.email,
            name: profile.name,
            surname: profile.surname,
            role: profile.role,
            status: profile.status
        }
    }
})

export async function signIn() {
    throw new Error('NextAuth is deprecated. Please use supabase.auth.signInWithPassword')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

// Dummy handlers to prevent Next.js build errors for [...nextauth] route (which will be deleted)
export const handlers = {
    GET: () => new Response('NextAuth is deprecated', { status: 404 }),
    POST: () => new Response('NextAuth is deprecated', { status: 404 })
}
