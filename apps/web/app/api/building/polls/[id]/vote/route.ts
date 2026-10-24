import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {castVoteSchema} from '@workspace/shared'

/**
 * POST /api/building/polls/[id]/vote
 * Casts (or changes) the caller's unit's vote. One vote per apartment,
 * matching how a real общо събрание counts — not one per person.
 */
export async function POST(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})
        if (!membership.unit_id) return NextResponse.json({error: 'You need an assigned unit to vote'}, {status: 403})

        const body = await request.json()
        const parsed = castVoteSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data: poll} = await supabaseAdmin
            .from('polls')
            .select('id, status, building_id')
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!poll) return NextResponse.json({error: 'Vote not found'}, {status: 404})
        if (poll.status !== 'open') return NextResponse.json({error: 'Voting is closed'}, {status: 409})

        const {data: option} = await supabaseAdmin
            .from('poll_options')
            .select('id')
            .eq('id', parsed.data.option_id)
            .eq('poll_id', id)
            .maybeSingle()
        if (!option) return NextResponse.json({error: 'Option not found'}, {status: 404})

        const {data, error} = await supabaseAdmin
            .from('poll_votes')
            .upsert(
                {poll_id: id, option_id: parsed.data.option_id, unit_id: membership.unit_id, user_id: auth.user.id},
                {onConflict: 'poll_id,unit_id'},
            )
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
