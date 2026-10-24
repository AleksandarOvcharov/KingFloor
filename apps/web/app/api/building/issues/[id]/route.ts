import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'
import {updateIssueStatusSchema} from '@workspace/shared'

/** PATCH /api/building/issues/[id] — admin only: change status. */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = updateIssueStatusSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('maintenance_issues')
            .update({
                status: parsed.data.status,
                resolved_at: parsed.data.status === 'resolved' ? new Date().toISOString() : null,
            })
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
