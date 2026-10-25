import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {createPollSchema} from '@workspace/shared'
import type {Poll} from '@workspace/shared'

/**
 * GET /api/building/polls
 * Any member: every poll with its options, vote counts, and the caller's
 * own vote (if their unit already cast one).
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: polls, error} = await supabaseAdmin
            .from('polls')
            .select('*')
            .eq('building_id', membership.building_id)
            .order('created_at', {ascending: false})
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const pollIds = (polls ?? []).map((p) => p.id)
        const [{data: options}, {data: votes}] = await Promise.all([
            pollIds.length
                ? supabaseAdmin.from('poll_options').select('*').in('poll_id', pollIds).order('position', {ascending: true})
                : Promise.resolve({data: []}),
            pollIds.length
                ? supabaseAdmin.from('poll_votes').select('poll_id, option_id, unit_id').in('poll_id', pollIds)
                : Promise.resolve({data: []}),
        ])

        const voteCountByOption = new Map<string, number>()
        for (const v of votes ?? []) {
            voteCountByOption.set(v.option_id, (voteCountByOption.get(v.option_id) ?? 0) + 1)
        }

        const enriched: Poll[] = (polls ?? []).map((p) => {
            const pollOptions = (options ?? [])
                .filter((o) => o.poll_id === p.id)
                .map((o) => ({...o, vote_count: voteCountByOption.get(o.id) ?? 0}))
            const pollVotes = (votes ?? []).filter((v) => v.poll_id === p.id)
            const myVote = membership.unit_id ? pollVotes.find((v) => v.unit_id === membership.unit_id) : undefined
            return {
                ...p,
                options: pollOptions,
                total_votes: pollVotes.length,
                my_vote_option_id: myVote?.option_id ?? null,
            }
        })

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/polls — admin only: create a poll with 2–8 options. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = createPollSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data: poll, error} = await supabaseAdmin
            .from('polls')
            .insert({
                building_id: membership.building_id,
                created_by: auth.user.id,
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                closes_at: parsed.data.closes_at || null,
            })
            .select()
            .single()
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const optionRows = parsed.data.options.map((option, position) => ({
            poll_id: poll.id,
            label: option.label,
            position,
            attachment_url: option.attachment_url || null,
            attachment_name: option.attachment_name || null,
        }))
        const {data: options, error: optionsError} = await supabaseAdmin.from('poll_options').insert(optionRows).select()
        if (optionsError) {
            // Don't leave a zero-option poll behind for an admin to notice
            // and clean up manually.
            await supabaseAdmin.from('polls').delete().eq('id', poll.id)
            return NextResponse.json({error: optionsError.message}, {status: 500})
        }

        return NextResponse.json({data: {...poll, options}}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
