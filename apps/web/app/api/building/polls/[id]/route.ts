import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'

/** PATCH /api/building/polls/[id] — admin only: close a poll. */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data, error} = await supabaseAdmin
            .from('polls')
            .update({status: 'closed'})
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

/** DELETE /api/building/polls/[id] — admin only. Options and votes cascade with it. */
export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data, error} = await supabaseAdmin
            .from('polls')
            .delete()
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .maybeSingle()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        if (!data) return NextResponse.json({error: 'Poll not found'}, {status: 404})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
