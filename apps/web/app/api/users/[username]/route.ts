import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'

export async function GET(
    _request: NextRequest,
    {params}: {params: Promise<{username: string}>}
) {
    try {
        const {username} = await params

        const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/
        if (!username || !USERNAME_REGEX.test(username)) {
            return NextResponse.json({error: 'User not found'}, {status: 404})
        }

        // Escape Postgres ILIKE wildcards (_ and %)
        const safeUsername = username.replace(/[_%]/g, '\\$&')

        const {data, error} = await supabaseAdmin
            .from('profiles')
            .select('id, username, display_name, bio, avatar_url, location, website, twitter_handle, github_handle, created_at, is_public')
            .ilike('username', safeUsername)
            .single()

        if (error || !data) {
            return NextResponse.json({error: 'User not found'}, {status: 404})
        }

        if (!data.is_public) {
            return NextResponse.json({error: 'This profile is private'}, {status: 403})
        }

        // Strip is_public before returning — clients don't need it
        const {is_public: _, ...publicData} = data
        return NextResponse.json({data: publicData})
    } catch {
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}
