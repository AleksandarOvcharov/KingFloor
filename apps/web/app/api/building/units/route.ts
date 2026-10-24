import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {createUnitSchema} from '@workspace/shared'
import type {Unit} from '@workspace/shared'

/**
 * GET /api/building/units
 * Admins see every unit in the building (with assigned resident, if any).
 * Residents only see their own unit.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        if (membership.role !== 'admin') {
            if (!membership.unit_id) return NextResponse.json({data: []})
            const {data, error} = await supabaseAdmin.from('units').select('*').eq('id', membership.unit_id)
            if (error) return NextResponse.json({error: error.message}, {status: 500})
            return NextResponse.json({data})
        }

        const [{data: units, error}, {data: members}] = await Promise.all([
            supabaseAdmin.from('units').select('*').eq('building_id', membership.building_id).order('number', {ascending: true}),
            supabaseAdmin.from('building_members').select('id, unit_id, user_id').eq('building_id', membership.building_id).not('unit_id', 'is', null),
        ])

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const residentUserIds = (members ?? []).map((m) => m.user_id)
        const {data: profiles} = residentUserIds.length
            ? await supabaseAdmin.from('profiles').select('id, display_name, username').in('id', residentUserIds)
            : {data: []}

        const memberByUnit = new Map((members ?? []).map((m) => [m.unit_id, m]))
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))

        const enriched: Unit[] = (units ?? []).map((u) => {
            const member = memberByUnit.get(u.id)
            return {
                ...u,
                resident_name: member ? profileById.get(member.user_id) ?? null : null,
                resident_member_id: member?.id ?? null,
            }
        })

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/units — admin only. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = createUnitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('units')
            .insert({
                building_id: membership.building_id,
                number: parsed.data.number,
                floor: parsed.data.floor ?? null,
                area_sqm: parsed.data.area_sqm ?? null,
                ideal_parts: parsed.data.ideal_parts ?? null,
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
