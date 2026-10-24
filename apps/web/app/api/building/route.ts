import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {createBuildingSchema, updateBuildingSchema} from '@workspace/shared'

/**
 * GET /api/building
 * Returns the current user's building membership: the building, their role,
 * and their own unit (if any). `data: null` means they're not in a building yet.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({data: null})

        const [{data: building}, {data: unit}] = await Promise.all([
            supabaseAdmin.from('buildings').select('*').eq('id', membership.building_id).single(),
            membership.unit_id
                ? supabaseAdmin.from('units').select('*').eq('id', membership.unit_id).single()
                : Promise.resolve({data: null}),
        ])

        return NextResponse.json({
            data: {building, role: membership.role, unit: unit ?? null},
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/building
 * Creates a new building and makes the caller its admin (via DB trigger).
 * A user already in a building cannot create another one in this MVP.
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
        const parsed = createBuildingSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('buildings')
            .insert({name: parsed.data.name, address: parsed.data.address ?? null, created_by: auth.user.id})
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        return NextResponse.json({data}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** PATCH /api/building — admin only: edit name/address/IBAN. */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = updateBuildingSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const updates: Record<string, string | null> = {}
        if (parsed.data.name !== undefined) updates.name = parsed.data.name
        if (parsed.data.address !== undefined) updates.address = parsed.data.address
        if (parsed.data.iban !== undefined) updates.iban = parsed.data.iban

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({error: 'No fields to update'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('buildings')
            .update(updates)
            .eq('id', membership.building_id)
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
