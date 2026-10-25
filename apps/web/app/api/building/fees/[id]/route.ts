import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'
import {feeActionSchema} from '@workspace/shared'

/** PATCH /api/building/fees/[id] — admin only: mark a fee paid/unpaid. */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = feeActionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data: fee} = await supabaseAdmin
            .from('fees')
            .select('*')
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!fee) return NextResponse.json({error: 'Fee not found'}, {status: 404})

        if (parsed.data.action === 'mark_paid') {
            const now = new Date().toISOString()
            // A fee can only be "paid" once at a time, so clear any stale
            // payment row from a previous paid→unpaid→paid cycle first —
            // otherwise each toggle adds another payments row and silently
            // inflates the cash balance / income chart by the same amount
            // every time an admin corrects a mistaken click.
            await supabaseAdmin.from('payments').delete().eq('fee_id', id)
            const [feeResult, paymentResult] = await Promise.all([
                supabaseAdmin.from('fees').update({status: 'paid', paid_at: now}).eq('id', id).select().single(),
                supabaseAdmin.from('payments').insert({
                    fee_id: id,
                    unit_id: fee.unit_id,
                    amount: fee.amount,
                    // Real cash collected door-to-door is the overwhelming
                    // common case for a домоуправител; a method can be
                    // specified explicitly to record it as a bank transfer.
                    method: parsed.data.method ?? 'cash',
                    note: parsed.data.note ?? null,
                    recorded_by: auth.user.id,
                    paid_at: now,
                }),
            ])
            // Both errors must be checked — a payments-insert failure here
            // would otherwise mark the fee paid while leaving no payment
            // record behind, silently under-counting real income on every
            // cash-balance/income-chart read from that point on.
            if (feeResult.error) return NextResponse.json({error: feeResult.error.message}, {status: 500})
            if (paymentResult.error) {
                // The fee update already landed — roll it back rather than
                // leave a "paid" fee with no payment row backing it.
                await supabaseAdmin.from('fees').update({status: 'unpaid', paid_at: null}).eq('id', id)
                return NextResponse.json({error: paymentResult.error.message}, {status: 500})
            }
            return NextResponse.json({data: feeResult.data})
        }

        // Reverting to unpaid must remove the payment record it created,
        // or the cash balance / income chart would keep counting money
        // that — as far as the fee itself now says — was never received.
        await supabaseAdmin.from('payments').delete().eq('fee_id', id)
        const {data: updated, error} = await supabaseAdmin
            .from('fees')
            .update({status: 'unpaid', paid_at: null})
            .eq('id', id)
            .select()
            .single()
        if (error) return NextResponse.json({error: error.message}, {status: 500})
        return NextResponse.json({data: updated})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
