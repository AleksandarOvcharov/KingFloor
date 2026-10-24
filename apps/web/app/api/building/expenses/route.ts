import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {createExpenseSchema} from '@workspace/shared'

/** GET /api/building/expenses — any member: the building's full expense log. */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data, error} = await supabaseAdmin
            .from('expenses')
            .select('*')
            .eq('building_id', membership.building_id)
            .order('spent_at', {ascending: false})

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const total = (data ?? []).reduce((sum, e) => sum + e.amount, 0)
        return NextResponse.json({data, total})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/expenses — admin only: log a new expense. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = createExpenseSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('expenses')
            .insert({
                building_id: membership.building_id,
                category: parsed.data.category,
                description: parsed.data.description ?? null,
                amount: parsed.data.amount,
                spent_at: parsed.data.spent_at || new Date().toISOString().slice(0, 10),
                recorded_by: auth.user.id,
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
