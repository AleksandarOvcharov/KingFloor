import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'

/**
 * DELETE /api/building/members/[id] — admin only: remove a resident from
 * the building entirely (e.g. they moved out). [id] is the building_members
 * row id, not the user id. Never allows removing the last admin's own row
 * through this route — admins manage their own membership differently.
 */
export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data: target} = await supabaseAdmin
            .from('building_members')
            .select('id, role')
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!target) return NextResponse.json({error: 'Member not found'}, {status: 404})
        if (target.role === 'admin') {
            return NextResponse.json({error: 'Admins cannot be removed this way'}, {status: 400})
        }

        const {error} = await supabaseAdmin.from('building_members').delete().eq('id', id)
        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data: {id}})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
