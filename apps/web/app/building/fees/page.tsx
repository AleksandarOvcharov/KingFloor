'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useFees} from '@/hooks/building/useFees'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Badge} from '@workspace/ui/ui/badge'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@workspace/ui/shadcn/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@workspace/ui/ui/select'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/ui/dropdown-menu'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {ExportButton} from '@/components/ui/export-button'
import {useI18n} from '@/lib/i18n/provider'
import type {Fee, FeeStatus} from '@workspace/shared'
import {ChevronDown, Plus} from 'lucide-react'

/**
 * A fee is only ever marked 'overdue' by hand (there's no background job
 * that flips it), so most fees that are genuinely late just sit as
 * 'unpaid' forever. Derive the status actually shown from the due date
 * instead of trusting the stored value alone.
 */
function effectiveStatus(fee: Fee): FeeStatus {
    if (fee.status !== 'unpaid') return fee.status
    if (fee.due_date && new Date(fee.due_date) < new Date(new Date().toDateString())) return 'overdue'
    return 'unpaid'
}

function statusVariant(status: FeeStatus): 'default' | 'secondary' | 'destructive' {
    if (status === 'paid') return 'default'
    if (status === 'overdue') return 'destructive'
    return 'secondary'
}

function GenerateFeesDialog({
    onGenerate,
}: {
    onGenerate: (input: {period: string; amount_mode: 'fixed' | 'per_sqm'; amount: number; due_date?: string | null}) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
    const [mode, setMode] = useState<'fixed' | 'per_sqm'>('fixed')
    const [amount, setAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onGenerate({
            period,
            amount_mode: mode,
            amount: Number(amount),
            due_date: dueDate || null,
        })
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setAmount('')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4"/>
                    {t.building.generateFees}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.building.generateFees}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="period">{t.building.periodLabel}</Label>
                        <Input id="period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                        <Label>{t.building.amountModeLabel}</Label>
                        <Select value={mode} onValueChange={(v) => setMode(v as 'fixed' | 'per_sqm')}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">{t.building.amountModeFixed}</SelectItem>
                                <SelectItem value="per_sqm">{t.building.amountModePerSqm}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t.building.amountLabel}</Label>
                        <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="due-date">{t.building.dueDateLabel}</Label>
                        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !amount || Number(amount) <= 0}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function FeesPage() {
    const {membership} = useBuildingContext()
    const {fees, totals, loading, error, generateFees, setFeeStatus} = useFees(!!membership)
    const {t, locale} = useI18n()

    if (!membership) return null
    const isAdmin = membership.role === 'admin'

    const statusLabel = (status: FeeStatus) =>
        status === 'paid' ? t.building.feeStatusPaid : status === 'overdue' ? t.building.feeStatusOverdue : t.building.feeStatusUnpaid

    const exportRows = fees.map((f) => ({
        [t.building.periodLabel]: f.period,
        ...(isAdmin ? {[t.building.navUnits]: f.unit_number ?? ''} : {}),
        [t.building.amountLabel]: f.amount.toFixed(2),
        [t.building.dueDateLabel]: f.due_date ?? '',
        [t.status.label]: statusLabel(effectiveStatus(f)),
    }))

    return (
        <div className="space-y-6">
            {!isAdmin && membership.building.iban && (
                <Alert>
                    <AlertDescription className="flex flex-wrap items-center gap-x-2">
                        <span className="text-muted-foreground">{t.building.ibanLabel}:</span>
                        <span className="font-mono font-medium tracking-wide">{membership.building.iban}</span>
                    </AlertDescription>
                </Alert>
            )}
            {isAdmin && (
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground">{t.building.totalCollected}</p>
                            <p className="text-2xl font-bold">{totals.collected.toFixed(2)} {t.common.currencySymbol}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground">{t.building.totalOutstanding}</p>
                            <p className="text-2xl font-bold">{totals.outstanding.toFixed(2)} {t.common.currencySymbol}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t.building.feesTitle}</CardTitle>
                    <div className="flex gap-2">
                        <ExportButton data={exportRows} filename="taksi" disabled={fees.length === 0}/>
                        {isAdmin && <GenerateFeesDialog onGenerate={generateFees}/>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {loading ? (
                        <Skeleton className="h-40 w-full"/>
                    ) : fees.length === 0 ? (
                        <EmptyState description={t.building.noFeesYet}/>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.building.periodLabel}</TableHead>
                                    {isAdmin && <TableHead>{t.building.navUnits}</TableHead>}
                                    <TableHead>{t.building.amountLabel}</TableHead>
                                    <TableHead>{t.building.dueDateLabel}</TableHead>
                                    <TableHead>{t.status.label}</TableHead>
                                    {isAdmin && <TableHead/>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map((f) => (
                                    <TableRow key={f.id}>
                                        <TableCell>{f.period}</TableCell>
                                        {isAdmin && <TableCell>{f.unit_number}</TableCell>}
                                        <TableCell className="font-medium">{f.amount.toFixed(2)} {t.common.currencySymbol}</TableCell>
                                        <TableCell>{f.due_date ? new Date(f.due_date).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US') : '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant(effectiveStatus(f))}>
                                                {statusLabel(effectiveStatus(f))}
                                            </Badge>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                {f.status === 'paid' ? (
                                                    <Button variant="outline" size="sm" onClick={() => setFeeStatus(f.id, 'mark_unpaid')}>
                                                        {t.building.markUnpaid}
                                                    </Button>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="gap-1">
                                                                {t.building.markPaid}
                                                                <ChevronDown className="h-3.5 w-3.5"/>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setFeeStatus(f.id, 'mark_paid', 'cash')}>
                                                                {t.building.payMethodCash}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setFeeStatus(f.id, 'mark_paid', 'bank_transfer')}>
                                                                {t.building.payMethodBankTransfer}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                {!isAdmin && <CardDescription className="px-6 pb-4">{t.building.myUnit}</CardDescription>}
            </Card>
        </div>
    )
}
