import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {generateFeesSchema} from '@workspace/shared'
import type {Fee} from '@workspace/shared'

/**
 * GET /api/building/fees
 * Admins see every unit's fees (optionally filtered by ?period=YYYY-MM),
 * plus collected/outstanding totals. Residents see only their own unit's fees.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const period = request.nextUrl.searchParams.get('period')

        let query = supabaseAdmin.from('fees').select('*').eq('building_id', membership.building_id)
        if (membership.role !== 'admin') {
            if (!membership.unit_id) return NextResponse.json({data: [], totals: {collected: 0, outstanding: 0}})
            query = query.eq('unit_id', membership.unit_id)
        }
        if (period) query = query.eq('period', period)

        const {data: fees, error} = await query.order('period', {ascending: false})
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const unitIds = Array.from(new Set((fees ?? []).map((f) => f.unit_id)))
        const {data: units} = unitIds.length
            ? await supabaseAdmin.from('units').select('id, number').in('id', unitIds)
            : {data: []}
        const unitById = new Map((units ?? []).map((u) => [u.id, u]))

        const enriched: Fee[] = (fees ?? []).map((f) => ({
            ...f,
            unit_number: unitById.get(f.unit_id)?.number,
        }))

        const collected = enriched.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)
        const outstanding = enriched.filter((f) => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0)

        return NextResponse.json({data: enriched, totals: {collected, outstanding}})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/building/fees — admin only: generate a fee for every unit for a
 * given month. Skips units that already have a fee for that period, and
 * (in per_sqm mode) units with no area_sqm set.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = generateFeesSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }
        const {period, amount_mode, amount, due_date} = parsed.data

        const {data: units, error: unitsError} = await supabaseAdmin
            .from('units')
            .select('id, area_sqm')
            .eq('building_id', membership.building_id)
        if (unitsError) return NextResponse.json({error: unitsError.message}, {status: 500})
        if (!units || units.length === 0) {
            return NextResponse.json({error: 'Add units before generating fees'}, {status: 400})
        }

        const {data: existingFees} = await supabaseAdmin
            .from('fees')
            .select('unit_id')
            .eq('building_id', membership.building_id)
            .eq('period', period)
        const alreadyBilled = new Set((existingFees ?? []).map((f) => f.unit_id))

        const skippedNoArea: string[] = []
        const rows = units
            .filter((u) => !alreadyBilled.has(u.id))
            .map((u) => {
                if (amount_mode === 'per_sqm') {
                    if (!u.area_sqm) {
                        skippedNoArea.push(u.id)
                        return null
                    }
                    return {
                        building_id: membership.building_id,
                        unit_id: u.id,
                        period,
                        amount: Math.round(u.area_sqm * amount * 100) / 100,
                        due_date: due_date || null,
                    }
                }
                return {
                    building_id: membership.building_id,
                    unit_id: u.id,
                    period,
                    amount,
                    due_date: due_date || null,
                }
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)

        if (rows.length === 0) {
            return NextResponse.json({error: 'All units already have a fee for this period, or are missing an area to bill per m²'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin.from('fees').insert(rows).select()
        if (error) return NextResponse.json({error: error.message}, {status: 500})

        return NextResponse.json({
            data,
            skipped: {alreadyBilled: alreadyBilled.size, noArea: skippedNoArea.length},
        }, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
