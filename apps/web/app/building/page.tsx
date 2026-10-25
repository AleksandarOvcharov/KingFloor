'use client'

import {useMemo, useState} from 'react'
import Link from 'next/link'
import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis} from 'recharts'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useFinanceSummary} from '@/hooks/building/useFinanceSummary'
import {useFees} from '@/hooks/building/useFees'
import {useIssues} from '@/hooks/building/useIssues'
import {usePolls} from '@/hooks/building/usePolls'
import {useAnnouncements} from '@/hooks/building/useAnnouncements'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Badge} from '@workspace/ui/ui/badge'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Tabs, TabsList, TabsTrigger} from '@workspace/ui/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@workspace/ui/shadcn/table'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {ExportButton} from '@/components/ui/export-button'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {OwnerDues, OwnerDuesStatus} from '@workspace/shared'
import {Wrench} from 'lucide-react'

const CATEGORY_COLORS = ['bg-indigo-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500']

function statusBadgeClass(status: OwnerDuesStatus): string {
    if (status === 'paid') return 'bg-success/10 text-success border-success/20 hover:bg-success/10'
    if (status === 'partial') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
    return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10'
}

function OwnerDuesTable({owners}: {owners: OwnerDues[]}) {
    const {t} = useI18n()
    const [tab, setTab] = useState<'unpaid' | 'paid' | 'all'>('unpaid')

    const unpaidCount = owners.filter((o) => o.status !== 'paid').length
    const paidCount = owners.filter((o) => o.status === 'paid').length

    const filtered = owners.filter((o) => {
        if (tab === 'unpaid') return o.status !== 'paid'
        if (tab === 'paid') return o.status === 'paid'
        return true
    })

    const statusLabel = (status: OwnerDuesStatus) => {
        if (status === 'paid') return t.building.dashboardStatusPaid
        if (status === 'partial') return t.building.dashboardStatusPartial
        return t.building.dashboardStatusUnpaid
    }

    const exportRows = owners.map((o) => ({
        [t.building.dashboardOwner]: o.display_name,
        [t.building.unitNumberLabel]: o.unit_number ?? '',
        [t.building.dashboardTotalDue]: o.total_due.toFixed(2),
        [t.status.label]: statusLabel(o.status),
    }))

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.building.dashboardBillBreakdown}</CardTitle>
                <ExportButton data={exportRows} filename="sobstvenici" disabled={owners.length === 0}/>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                    <TabsList>
                        <TabsTrigger value="unpaid">{t.building.dashboardTabUnpaid} ({unpaidCount})</TabsTrigger>
                        <TabsTrigger value="paid">{t.building.dashboardTabPaid} ({paidCount})</TabsTrigger>
                        <TabsTrigger value="all">{t.building.dashboardTabAll} ({owners.length})</TabsTrigger>
                    </TabsList>
                </Tabs>
                {filtered.length === 0 ? (
                    <EmptyState description={t.building.dashboardNoOwners}/>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.building.dashboardOwner}</TableHead>
                                <TableHead>{t.building.dashboardTotalDue}</TableHead>
                                <TableHead>{t.status.label}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((o) => (
                                <TableRow key={o.user_id}>
                                    <TableCell className="font-medium">{o.display_name}</TableCell>
                                    <TableCell>{o.total_due.toFixed(2)} {t.common.currencySymbol}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusBadgeClass(o.status)}>
                                            {statusLabel(o.status)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

function AdminDashboard() {
    const {membership} = useBuildingContext()
    const {summary, loading} = useFinanceSummary(!!membership)
    const {t} = useI18n()

    // Matches the chart just below it (both keyed off payment/expense dates,
    // not the fee's billing period) so the headline figure and the last
    // point of the line are never telling two different stories.
    const netThisMonth = useMemo(() => {
        if (!summary || summary.monthlySeries.length === 0) return 0
        const latest = summary.monthlySeries[summary.monthlySeries.length - 1]
        return latest.income - latest.expense
    }, [summary])

    if (loading || !summary) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="min-h-56 rounded-xl"/>)}
                </div>
                <Skeleton className="h-72 rounded-xl"/>
            </div>
        )
    }

    const maxCategory = summary.expensesByCategory[0]?.total ?? 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Income & expenses */}
                <Card className="h-full min-h-56 flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div>
                            <CardTitle className="text-sm font-medium">{t.building.dashboardIncomeExpense}</CardTitle>
                            <CardDescription className="text-xs">{t.building.dashboardLast6Months}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">{t.building.dashboardCashbook}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 flex-1 flex flex-col justify-center">
                        <p className={`text-2xl font-bold ${netThisMonth >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {netThisMonth >= 0 ? '+' : ''}{netThisMonth.toFixed(2)} {t.common.currencySymbol}
                        </p>
                        <div className="h-16 -mx-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={summary.monthlySeries} margin={{top: 4, right: 4, left: 4, bottom: 0}}>
                                    <defs>
                                        <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.35}/>
                                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="label" hide/>
                                    <Tooltip
                                        contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12}}
                                        formatter={(value) => `${Number(value).toFixed(2)} €`}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#incomeFill)" strokeWidth={2}/>
                                    <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" fill="url(#expenseFill)" strokeWidth={2}/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>{t.building.feesTitle}</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive"/>{t.building.expensesTitle}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Total balance */}
                <Card className="h-full min-h-56 flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div>
                            <CardTitle className="text-sm font-medium">{t.building.dashboardTotalBalance}</CardTitle>
                            <CardDescription className="text-xs">{t.building.dashboardAsOfToday}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">{t.building.dashboardCashbook}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                        <p className="text-2xl font-bold">{summary.cashBalance.toFixed(2)} {t.common.currencySymbol}</p>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                            <div
                                className="h-full bg-primary"
                                style={{width: `${summary.cashTotal + summary.onlineTotal > 0 ? (summary.cashTotal / (summary.cashTotal + summary.onlineTotal)) * 100 : 0}%`}}
                            />
                            <div className="h-full bg-sky-400" style={{width: `${summary.cashTotal + summary.onlineTotal > 0 ? (summary.onlineTotal / (summary.cashTotal + summary.onlineTotal)) * 100 : 0}%`}}/>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>{summary.cashTotal.toFixed(2)} {t.common.currencySymbol} {t.building.dashboardCash}</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-400"/>{summary.onlineTotal.toFixed(2)} {t.common.currencySymbol} {t.building.dashboardOnline}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Remaining to pay */}
                <Link href="/building/fees" className="block h-full">
                    <Card className="h-full min-h-56 flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">{t.building.dashboardRemainingToPay}</CardTitle>
                                <CardDescription className="text-xs">{summary.period}</CardDescription>
                            </div>
                            <Badge variant="destructive" className="text-xs">{t.building.dashboardUnpaidBadge}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                            <div>
                                <p className="text-2xl font-bold">{summary.outstandingCount}</p>
                                <p className="text-xs text-muted-foreground">{t.building.dashboardApartments}</p>
                            </div>
                            <p className="text-lg font-semibold text-destructive">{summary.outstandingThisPeriod.toFixed(2)} {t.common.currencySymbol}</p>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-destructive"
                                    style={{width: `${summary.unitCount > 0 ? (summary.outstandingCount / summary.unitCount) * 100 : 0}%`}}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">{tFormat(t.building.dashboardOfTotal, {total: summary.unitCount})}</p>
                        </CardContent>
                    </Card>
                </Link>

                {/* Expenses by category */}
                <Link href="/building/expenses" className="block h-full">
                    <Card className="h-full min-h-56 flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">{t.building.dashboardExpensesByCategory}</CardTitle>
                                <CardDescription className="text-xs">{t.building.dashboardThisMonth}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2.5 flex-1 flex flex-col justify-center">
                            <p className="text-2xl font-bold">{summary.expensesThisMonth.toFixed(2)} {t.common.currencySymbol}</p>
                            {summary.expensesByCategory.length === 0 ? (
                                <p className="text-xs text-muted-foreground">{t.building.dashboardNoExpensesYet}</p>
                            ) : (
                                summary.expensesByCategory.slice(0, 4).map((c, i) => (
                                    <div key={c.category} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="truncate">{c.category}</span>
                                            <span className="font-medium shrink-0 ml-2">{c.total.toFixed(0)} {t.common.currencySymbol}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                                                style={{width: `${maxCategory > 0 ? (c.total / maxCategory) * 100 : 0}%`}}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <OwnerDuesTable owners={summary.ownerDues}/>
        </div>
    )
}

function ResidentDashboard() {
    const {membership} = useBuildingContext()
    const {fees, totals} = useFees(!!membership)
    const {issues} = useIssues(!!membership)
    const {polls} = usePolls(!!membership)
    const {announcements} = useAnnouncements(!!membership)
    const {t} = useI18n()

    if (!membership) return null

    const unpaidCount = fees.filter((f) => f.status !== 'paid').length
    const openIssues = issues.filter((i) => i.status !== 'resolved').length
    const activePolls = polls.filter((p) => p.status === 'open').length

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/building/fees" className="block h-full">
                    <Card className="h-full min-h-28 flex flex-col hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6 space-y-1 flex-1 flex flex-col justify-center">
                            <p className="text-2xl font-bold">{unpaidCount}</p>
                            <p className="text-xs text-muted-foreground">{t.building.statOutstandingFees}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/building/issues" className="block h-full">
                    <Card className="h-full min-h-28 flex flex-col hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6 space-y-1 flex-1 flex flex-col justify-center">
                            <Wrench className="h-4 w-4 text-muted-foreground"/>
                            <p className="text-2xl font-bold">{openIssues}</p>
                            <p className="text-xs text-muted-foreground">{t.building.statOpenIssues}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/building/polls" className="block h-full">
                    <Card className="h-full min-h-28 flex flex-col hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6 space-y-1 flex-1 flex flex-col justify-center">
                            <p className="text-2xl font-bold">{activePolls}</p>
                            <p className="text-xs text-muted-foreground">{t.building.statActivePolls}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/building/announcements" className="block h-full">
                    <Card className="h-full min-h-28 flex flex-col hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6 space-y-1 flex-1 flex flex-col justify-center">
                            <p className="text-2xl font-bold">{announcements.length}</p>
                            <p className="text-xs text-muted-foreground">{t.building.statAnnouncements}</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t.building.myUnit}</CardTitle>
                </CardHeader>
                <CardContent>
                    {membership.unit ? (
                        <p className="text-sm">
                            {t.building.unitNumberLabel} {membership.unit.number}
                            {membership.unit.floor != null && ` · ${t.building.unitFloorLabel} ${membership.unit.floor}`}
                            {membership.unit.area_sqm != null && ` · ${membership.unit.area_sqm} m²`}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t.building.unitNoResident}</p>
                    )}
                </CardContent>
            </Card>

            {totals.outstanding > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            {t.building.totalOutstanding}
                            <Badge variant="outline">{totals.outstanding.toFixed(2)} {t.common.currencySymbol}</Badge>
                        </CardTitle>
                        <CardDescription>{t.building.totalCollected}: {totals.collected.toFixed(2)} {t.common.currencySymbol}</CardDescription>
                    </CardHeader>
                </Card>
            )}
        </div>
    )
}

export default function BuildingOverviewPage() {
    const {membership} = useBuildingContext()

    if (!membership) return null

    return membership.role === 'admin' ? <AdminDashboard/> : <ResidentDashboard/>
}
