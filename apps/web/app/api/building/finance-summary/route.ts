import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'
import type {ExpenseCategoryTotal, FinanceMonthPoint, FinanceSummary, OwnerDues, OwnerDuesStatus} from '@workspace/shared'

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LABELS_BG = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']

function monthLabel(period: string, locale: string): string {
    const [, m] = period.split('-')
    const idx = Number(m) - 1
    return locale === 'bg' ? MONTH_LABELS_BG[idx] : MONTH_LABELS_EN[idx]
}

/**
 * GET /api/building/finance-summary
 * Admin-only aggregate for the dashboard: cash balance, this month's
 * collection vs. outstanding, a 6-month income/expense series, expenses by
 * category, and a per-owner dues breakdown. One call so the dashboard isn't
 * stitching together four separate fetches on first paint.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'bg'
        const now = new Date()
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const {data: fees} = await supabaseAdmin
            .from('fees')
            .select('id, unit_id, period, amount, status')
            .eq('building_id', membership.building_id)
        const allFees = fees ?? []
        const feeIds = allFees.map((f) => f.id)

        const [{data: payments}, {data: expenses}, {data: units}, {data: members}] = await Promise.all([
            feeIds.length
                ? supabaseAdmin.from('payments').select('amount, method, paid_at, fee_id').in('fee_id', feeIds)
                : Promise.resolve({data: []}),
            supabaseAdmin.from('expenses').select('category, amount, spent_at').eq('building_id', membership.building_id),
            supabaseAdmin.from('units').select('id').eq('building_id', membership.building_id),
            supabaseAdmin.from('building_members').select('user_id, unit_id').eq('building_id', membership.building_id).not('unit_id', 'is', null),
        ])

        const allPayments = payments ?? []
        const allExpenses = expenses ?? []

        // ── This period's collection status ─────────────────────────────
        const feesThisPeriod = allFees.filter((f) => f.period === period)
        const collectedThisPeriod = feesThisPeriod.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
        const outstandingFees = feesThisPeriod.filter((f) => f.status !== 'paid')
        const outstandingThisPeriod = outstandingFees.reduce((s, f) => s + f.amount, 0)

        // ── Cash book: all-time balance, split by how it was paid ──────
        const cashTotal = allPayments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0)
        const onlineTotal = allPayments.filter((p) => p.method !== 'cash').reduce((s, p) => s + p.amount, 0)
        const totalExpensesAllTime = allExpenses.reduce((s, e) => s + e.amount, 0)
        const cashBalance = cashTotal + onlineTotal - totalExpensesAllTime

        // ── This calendar month's expenses, by category ─────────────────
        const monthExpenses = allExpenses.filter((e) => e.spent_at.slice(0, 7) === period)
        const expensesThisMonth = monthExpenses.reduce((s, e) => s + e.amount, 0)
        const categoryTotals = new Map<string, number>()
        for (const e of monthExpenses) {
            categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount)
        }
        const expensesByCategory: ExpenseCategoryTotal[] = Array.from(categoryTotals.entries())
            .map(([category, total]) => ({category, total}))
            .sort((a, b) => b.total - a.total)

        // ── Last 6 months: income (payments received) vs. expenses ─────
        const monthKeys: string[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }
        const incomeByMonth = new Map<string, number>()
        for (const p of allPayments) {
            const key = p.paid_at.slice(0, 7)
            incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + p.amount)
        }
        const expenseByMonth = new Map<string, number>()
        for (const e of allExpenses) {
            const key = e.spent_at.slice(0, 7)
            expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + e.amount)
        }
        const monthlySeries: FinanceMonthPoint[] = monthKeys.map((key) => ({
            period: key,
            label: monthLabel(key, locale),
            income: incomeByMonth.get(key) ?? 0,
            expense: expenseByMonth.get(key) ?? 0,
        }))

        // ── Per-owner dues ───────────────────────────────────────────────
        const residentMembers = (members ?? []).filter((m) => m.unit_id)
        const userIds = residentMembers.map((m) => m.user_id)
        const unitIds = residentMembers.map((m) => m.unit_id as string)
        const [{data: profiles}, {data: dueUnits}] = await Promise.all([
            userIds.length ? supabaseAdmin.from('profiles').select('id, display_name, username').in('id', userIds) : Promise.resolve({data: []}),
            unitIds.length ? supabaseAdmin.from('units').select('id, number').in('id', unitIds) : Promise.resolve({data: []}),
        ])
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))
        const unitNumberById = new Map((dueUnits ?? []).map((u) => [u.id, u.number]))
        const feesByUnit = new Map<string, typeof allFees>()
        for (const f of allFees) {
            const list = feesByUnit.get(f.unit_id) ?? []
            list.push(f)
            feesByUnit.set(f.unit_id, list)
        }

        const ownerDues: OwnerDues[] = residentMembers.map((m) => {
            const unitFees = feesByUnit.get(m.unit_id as string) ?? []
            const unpaid = unitFees.filter((f) => f.status !== 'paid')
            const paid = unitFees.filter((f) => f.status === 'paid')
            let status: OwnerDuesStatus = 'unpaid'
            if (unitFees.length > 0) {
                if (unpaid.length === 0) status = 'paid'
                else if (paid.length > 0) status = 'partial'
                else status = 'unpaid'
            }
            return {
                user_id: m.user_id,
                display_name: profileById.get(m.user_id) ?? '—',
                unit_number: unitNumberById.get(m.unit_id as string) ?? null,
                total_due: unpaid.reduce((s, f) => s + f.amount, 0),
                status,
            }
        })
        ownerDues.sort((a, b) => b.total_due - a.total_due)

        const summary: FinanceSummary = {
            period,
            collectedThisPeriod,
            outstandingThisPeriod,
            outstandingCount: outstandingFees.length,
            unitCount: (units ?? []).length,
            cashBalance,
            cashTotal,
            onlineTotal,
            expensesThisMonth,
            monthlySeries,
            expensesByCategory,
            ownerDues,
        }

        return NextResponse.json({data: summary})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
