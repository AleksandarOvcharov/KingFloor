import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {lookupBuildingSchema} from '@workspace/shared'
import type {JoinableUnit} from '@workspace/shared'

/**
 * GET /api/building/lookup?code=XXXXXX
 * For a user who isn't in a building yet: resolves an invite code to the
 * building's public info plus the units still free for a resident to claim
 * (i.e. not already linked to a building_members row).
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const existing = await getMembership(auth.user.id)
        if (existing) {
            return NextResponse.json({error: 'You already belong to a building'}, {status: 409})
        }

        const parsed = lookupBuildingSchema.safeParse({invite_code: request.nextUrl.searchParams.get('code') ?? ''})
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid code'}, {status: 400})
        }

        const {data: building} = await supabaseAdmin
            .from('buildings')
            .select('id, name, address')
            .eq('invite_code', parsed.data.invite_code)
            .maybeSingle()
        if (!building) {
            return NextResponse.json({error: 'No building found with that code'}, {status: 404})
        }

        const [{data: units}, {data: members}] = await Promise.all([
            supabaseAdmin.from('units').select('id, number, floor, area_sqm').eq('building_id', building.id),
            supabaseAdmin.from('building_members').select('unit_id').eq('building_id', building.id).not('unit_id', 'is', null),
        ])

        const takenUnitIds = new Set((members ?? []).map((m) => m.unit_id))

        const joinableUnits: JoinableUnit[] = (units ?? [])
            .filter((u) => !takenUnitIds.has(u.id))
            .map((u) => ({
                id: u.id,
                number: u.number,
                floor: u.floor,
                area_sqm: u.area_sqm,
            }))

        return NextResponse.json({data: {building, units: joinableUnits}})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
