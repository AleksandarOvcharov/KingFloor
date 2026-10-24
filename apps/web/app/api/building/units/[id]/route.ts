import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'
import {updateUnitSchema} from '@workspace/shared'

/** PATCH /api/building/units/[id] — admin only: edit an apartment's details. */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = updateUnitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const updates: Record<string, string | number | null> = {}
        if (parsed.data.number !== undefined) updates.number = parsed.data.number
        if (parsed.data.floor !== undefined) updates.floor = parsed.data.floor
        if (parsed.data.area_sqm !== undefined) updates.area_sqm = parsed.data.area_sqm
        if (parsed.data.ideal_parts !== undefined) updates.ideal_parts = parsed.data.ideal_parts

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({error: 'No fields to update'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('units')
            .update(updates)
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        if (!data) return NextResponse.json({error: 'Unit not found'}, {status: 404})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * DELETE /api/building/units/[id] — admin only. Fees and votes for the unit
 * are removed with it (ON DELETE CASCADE); any resident assigned to it and
 * any maintenance issues referencing it just lose that link (ON DELETE SET
 * NULL) rather than being deleted themselves.
 */
export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data, error} = await supabaseAdmin
            .from('units')
            .delete()
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .maybeSingle()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        if (!data) return NextResponse.json({error: 'Unit not found'}, {status: 404})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
