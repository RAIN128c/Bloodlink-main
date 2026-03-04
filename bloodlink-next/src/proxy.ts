import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
    // Update session and get user in a single getUser() call
    const { response, user } = await updateSession(request)

    const { pathname } = request.nextUrl

    // Protected routes — use the user from updateSession (no extra getUser() call)
    const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/patients') || pathname.startsWith('/history') || pathname.startsWith('/profile') || pathname.startsWith('/inbox') || pathname.startsWith('/lab')

    if (isDashboardRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from public auth pages
    const isAuthPage = pathname === '/login' || pathname === '/register'
    if (isAuthPage && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
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
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
