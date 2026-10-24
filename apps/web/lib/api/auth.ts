import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import type {User} from '@supabase/supabase-js'

/**
 * Authenticate a request via Bearer token.
 * Returns the verified user or a 401 NextResponse.
 */
export async function authenticateRequest(
    request: NextRequest
): Promise<{user: User} | {error: NextResponse}> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return {error: NextResponse.json({error: 'Unauthorized'}, {status: 401})}
    }

    const token = authHeader.split(' ')[1]
    const {data: {user}, error} = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
        return {error: NextResponse.json({error: 'Invalid token'}, {status: 401})}
    }

    return {user}
}
