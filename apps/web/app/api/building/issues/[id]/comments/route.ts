import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {createIssueCommentSchema} from '@workspace/shared'
import type {MaintenanceComment} from '@workspace/shared'

/** GET /api/building/issues/[id]/comments — any member of the building. */
export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: issue} = await supabaseAdmin
            .from('maintenance_issues')
            .select('id')
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!issue) return NextResponse.json({error: 'Issue not found'}, {status: 404})

        const {data: comments, error} = await supabaseAdmin
            .from('maintenance_comments')
            .select('*')
            .eq('issue_id', id)
            .order('created_at', {ascending: true})
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const authorIds = Array.from(new Set((comments ?? []).map((c) => c.author_id).filter((id2): id2 is string => !!id2)))
        const {data: profiles} = authorIds.length
            ? await supabaseAdmin.from('profiles').select('id, display_name, username').in('id', authorIds)
            : {data: []}
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))

        const enriched: MaintenanceComment[] = (comments ?? []).map((c) => ({
            ...c,
            author_name: c.author_id ? profileById.get(c.author_id) ?? null : null,
        }))

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/issues/[id]/comments — any member of the building. */
export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: issue} = await supabaseAdmin
            .from('maintenance_issues')
            .select('id')
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!issue) return NextResponse.json({error: 'Issue not found'}, {status: 404})

        const body = await request.json()
        const parsed = createIssueCommentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('maintenance_comments')
            .insert({issue_id: id, author_id: auth.user.id, body: parsed.data.body})
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
