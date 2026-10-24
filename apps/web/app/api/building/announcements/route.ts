import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {createAnnouncementSchema} from '@workspace/shared'
import type {Announcement} from '@workspace/shared'

/** GET /api/building/announcements — any member, pinned first then newest. */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: announcements, error} = await supabaseAdmin
            .from('announcements')
            .select('*')
            .eq('building_id', membership.building_id)
            .order('pinned', {ascending: false})
            .order('created_at', {ascending: false})

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const authorIds = Array.from(new Set((announcements ?? []).map((a) => a.author_id).filter((id): id is string => !!id)))
        const {data: profiles} = authorIds.length
            ? await supabaseAdmin.from('profiles').select('id, display_name, username').in('id', authorIds)
            : {data: []}
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))

        const enriched: Announcement[] = (announcements ?? []).map((a) => ({
            ...a,
            author_name: a.author_id ? profileById.get(a.author_id) ?? null : null,
        }))

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/announcements — admin only. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = createAnnouncementSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('announcements')
            .insert({
                building_id: membership.building_id,
                author_id: auth.user.id,
                title: parsed.data.title,
                body: parsed.data.body,
                pinned: parsed.data.pinned,
            })
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
