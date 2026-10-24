import {NextRequest, NextResponse} from 'next/server'

/**
 * Server-side proxy (formerly middleware) that protects private routes.
 * Redirects to /login if no Supabase auth session cookie is found.
 *
 * This fires before any page JS runs, providing server-side protection
 * in addition to the client-side useAuth() redirect hooks.
 */

const PROTECTED_PREFIXES = ['/building', '/settings']

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl

    // Only run on protected paths
    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
    if (!isProtected) return NextResponse.next()

    // Supabase stores the session as a cookie with "auth-token" in the name
    const cookies = request.cookies.getAll()
    const hasSession = cookies.some(
        c => c.name.includes('auth-token') && c.value.length > 0
    )

    if (!hasSession) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/building/:path*',
        '/settings/:path*',
    ],
}
