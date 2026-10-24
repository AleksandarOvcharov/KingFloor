import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {joinBuildingSchema} from '@workspace/shared'

/**
 * POST /api/building/join
 * Self-service resident join: validates the invite code still matches the
 * requested unit's building, and that the unit isn't already taken, then
 * creates the building_members row directly — no admin approval step.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const existing = await getMembership(auth.user.id)
        if (existing) {
            return NextResponse.json({error: 'You already belong to a building'}, {status: 409})
        }

        const body = await request.json()
        const parsed = joinBuildingSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data: building} = await supabaseAdmin
            .from('buildings')
            .select('id')
            .eq('invite_code', parsed.data.invite_code)
            .maybeSingle()
        if (!building) {
            return NextResponse.json({error: 'No building found with that code'}, {status: 404})
        }

        const {data: unit} = await supabaseAdmin
            .from('units')
            .select('id')
            .eq('id', parsed.data.unit_id)
            .eq('building_id', building.id)
            .maybeSingle()
        if (!unit) {
            return NextResponse.json({error: 'That apartment does not belong to this building'}, {status: 404})
        }

        const {data: takenBy} = await supabaseAdmin
            .from('building_members')
            .select('id')
            .eq('unit_id', unit.id)
            .maybeSingle()
        if (takenBy) {
            return NextResponse.json({error: 'That apartment already has a resident — refresh and pick another'}, {status: 409})
        }

        const {data, error} = await supabaseAdmin
            .from('building_members')
            .insert({building_id: building.id, user_id: auth.user.id, role: 'resident', unit_id: unit.id})
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({error: 'That apartment already has a resident — refresh and pick another'}, {status: 409})
            }
            return NextResponse.json({error: error.message}, {status: 500})
        }
        return NextResponse.json({data}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
