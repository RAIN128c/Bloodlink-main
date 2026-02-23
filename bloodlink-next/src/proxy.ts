import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
    // Update session on every request to keep it active
    const response = await updateSession(request)

    const { pathname } = request.nextUrl

    // Protected routes
    const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/patients') || pathname.startsWith('/history') || pathname.startsWith('/profile') || pathname.startsWith('/inbox') || pathname.startsWith('/lab');

    if (isDashboardRoute) {
        // We already updated the session, now let's read the cookie or user manually if needed
        // The `updateSession` function ensures the auth cookie is fresh.
        const { createServerClient } = await import('@supabase/ssr')
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll() { }
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // Redirect authenticated users away from public auth pages
    const isAuthPage = pathname === '/login' || pathname === '/register'
    if (isAuthPage) {
        const { createServerClient } = await import('@supabase/ssr')
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll() { }
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images, icons, docs (public assets)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
