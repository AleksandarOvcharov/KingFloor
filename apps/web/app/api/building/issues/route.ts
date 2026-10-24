import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {createIssueSchema} from '@workspace/shared'
import type {MaintenanceIssue} from '@workspace/shared'

/** GET /api/building/issues — any member sees every issue in the building. */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: issues, error} = await supabaseAdmin
            .from('maintenance_issues')
            .select('*')
            .eq('building_id', membership.building_id)
            .order('created_at', {ascending: false})
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const issueIds = (issues ?? []).map((i) => i.id)
        const unitIds = Array.from(new Set((issues ?? []).map((i) => i.unit_id).filter((id): id is string => !!id)))
        const reporterIds = Array.from(new Set((issues ?? []).map((i) => i.reported_by).filter((id): id is string => !!id)))

        const [{data: units}, {data: profiles}, {data: comments}] = await Promise.all([
            unitIds.length ? supabaseAdmin.from('units').select('id, number').in('id', unitIds) : Promise.resolve({data: []}),
            reporterIds.length
                ? supabaseAdmin.from('profiles').select('id, display_name, username').in('id', reporterIds)
                : Promise.resolve({data: []}),
            issueIds.length
                ? supabaseAdmin.from('maintenance_comments').select('issue_id').in('issue_id', issueIds)
                : Promise.resolve({data: []}),
        ])

        const unitById = new Map((units ?? []).map((u) => [u.id, u.number]))
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))
        const commentCountByIssue = new Map<string, number>()
        for (const c of comments ?? []) {
            commentCountByIssue.set(c.issue_id, (commentCountByIssue.get(c.issue_id) ?? 0) + 1)
        }

        const enriched: MaintenanceIssue[] = (issues ?? []).map((i) => ({
            ...i,
            unit_number: i.unit_id ? unitById.get(i.unit_id) ?? null : null,
            reporter_name: i.reported_by ? profileById.get(i.reported_by) ?? null : null,
            comment_count: commentCountByIssue.get(i.id) ?? 0,
        }))

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/issues — any member can report an issue. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const body = await request.json()
        const parsed = createIssueSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('maintenance_issues')
            .insert({
                building_id: membership.building_id,
                unit_id: parsed.data.unit_id ?? membership.unit_id ?? null,
                reported_by: auth.user.id,
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                priority: parsed.data.priority,
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
