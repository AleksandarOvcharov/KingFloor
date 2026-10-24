import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin, supabaseServer} from '@/lib/supabase/server'

// Allowed username pattern: 3–30 chars, letters/numbers/underscore/dash only
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/

function isValidHttpUrl(value: string): boolean {
    try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`)
        return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
        return false
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Verify the user's auth token
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({error: 'Missing auth token'}, {status: 401})
        }

        const token = authHeader.replace('Bearer ', '')
        const {data: {user}, error: authError} = await supabaseServer.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({error: 'Invalid or expired token'}, {status: 401})
        }

        const body = await request.json()
        const {username, bio, avatar_url, is_public, display_name, location, website, twitter_handle, github_handle} = body

        // ── Validation ─────────────────────────────────────────────────────────────
        let cleanUsername: string | undefined
        if (username !== undefined) {
            if (typeof username !== 'string') {
                return NextResponse.json(
                    {error: 'Username must be a valid string'},
                    {status: 400}
                )
            }
            cleanUsername = username.trim()
            if (!USERNAME_REGEX.test(cleanUsername)) {
                return NextResponse.json(
                    {error: 'Username must be 3–30 characters: letters, numbers, _ or - only'},
                    {status: 400}
                )
            }
        }

        let cleanBio: string | null | undefined
        if (bio !== undefined && bio !== null) {
            if (typeof bio !== 'string' || bio.trim().length > 300)
                return NextResponse.json({error: 'Bio must be 300 characters or fewer'}, {status: 400})
            cleanBio = bio.trim()
        } else if (bio === null) {
            cleanBio = null
        }

        let cleanDisplayName: string | null | undefined
        if (display_name !== undefined && display_name !== null) {
            if (typeof display_name !== 'string' || display_name.trim().length > 60)
                return NextResponse.json({error: 'Display name must be 60 characters or fewer'}, {status: 400})
            cleanDisplayName = display_name.trim()
        } else if (display_name === null) {
            cleanDisplayName = null
        }

        let cleanLocation: string | null | undefined
        if (location !== undefined && location !== null) {
            if (typeof location !== 'string' || location.trim().length > 100)
                return NextResponse.json({error: 'Location must be 100 characters or fewer'}, {status: 400})
            cleanLocation = location.trim()
        } else if (location === null) {
            cleanLocation = null
        }

        let cleanTwitter: string | null | undefined
        if (twitter_handle !== undefined && twitter_handle !== null) {
            if (typeof twitter_handle !== 'string' || twitter_handle.trim().length > 50)
                return NextResponse.json({error: 'Twitter handle must be 50 characters or fewer'}, {status: 400})
            cleanTwitter = twitter_handle.trim().replace(/^@/, '')
        } else if (twitter_handle === null) {
            cleanTwitter = null
        }

        let cleanGithub: string | null | undefined
        if (github_handle !== undefined && github_handle !== null) {
            if (typeof github_handle !== 'string' || github_handle.trim().length > 50)
                return NextResponse.json({error: 'GitHub handle must be 50 characters or fewer'}, {status: 400})
            cleanGithub = github_handle.trim().replace(/^@/, '')
        } else if (github_handle === null) {
            cleanGithub = null
        }

        // website — must be a valid http/https URL if provided
        let cleanWebsite: string | null | undefined
        if (website !== undefined && website !== null) {
            if (typeof website !== 'string' || !isValidHttpUrl(website.trim())) {
                return NextResponse.json(
                    {error: 'Website must be a valid http/https URL'},
                    {status: 400}
                )
            }
            cleanWebsite = website.trim()
        } else if (website === null) {
            cleanWebsite = null
        }

        // avatar_url — must come from Supabase Storage (or be cleared)
        if (avatar_url !== undefined && avatar_url !== null) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            if (typeof avatar_url !== 'string' || !avatar_url.startsWith(supabaseUrl)) {
                return NextResponse.json(
                    {error: 'avatar_url must point to your Supabase storage'},
                    {status: 400}
                )
            }
        }

        if (is_public !== undefined && typeof is_public !== 'boolean') {
            return NextResponse.json({error: 'is_public must be a boolean'}, {status: 400})
        }

        // ── Build update object ───────────────────────────────────────────────────
        const updates: Record<string, string | boolean | null> = {}
        if (cleanUsername !== undefined) updates.username = cleanUsername
        if (cleanBio !== undefined) updates.bio = cleanBio
        if (avatar_url !== undefined) updates.avatar_url = avatar_url
        if (is_public !== undefined) updates.is_public = is_public
        if (cleanDisplayName !== undefined) updates.display_name = cleanDisplayName
        if (cleanLocation !== undefined) updates.location = cleanLocation
        if (cleanWebsite !== undefined) updates.website = cleanWebsite
        if (cleanTwitter !== undefined) updates.twitter_handle = cleanTwitter
        if (cleanGithub !== undefined) updates.github_handle = cleanGithub

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({error: 'No fields to update'}, {status: 400})
        }

        // Check username uniqueness if updating username
        if (cleanUsername !== undefined) {
            const {data: existing} = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('username', cleanUsername)
                .neq('id', user.id)
                .maybeSingle()

            if (existing) {
                return NextResponse.json({error: 'Username already taken'}, {status: 409})
            }
        }

        // Upsert using admin client (creates profile if missing, updates if exists)
        const {data, error} = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                ...updates,
            })
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({error: error.message}, {status: 500})
        }

        return NextResponse.json({data})
    } catch {
        return NextResponse.json({error: 'Internal server error'}, {status: 500})
    }
}
