'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useExpenses} from '@/hooks/building/useExpenses'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@workspace/ui/shadcn/table'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/ui/dialog'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {ExportButton} from '@/components/ui/export-button'
import {useI18n} from '@/lib/i18n/provider'
import {Coins, Plus} from 'lucide-react'

function NewExpenseDialog({
    onAdd,
}: {
    onAdd: (input: {category: string; description?: string; amount: number; spent_at?: string}) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [spentAt, setSpentAt] = useState(() => new Date().toISOString().slice(0, 10))
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onAdd({
            category: category.trim(),
            description: description.trim() || undefined,
            amount: Number(amount),
            spent_at: spentAt,
        })
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setCategory('')
        setDescription('')
        setAmount('')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4"/>
                    {t.building.newExpense}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.building.newExpense}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="expense-category">{t.building.expenseCategoryLabel}</Label>
                        <Input
                            id="expense-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder={t.building.expenseCategoryPlaceholder}
                            list="expense-category-suggestions"
                            maxLength={60}
                        />
                        <datalist id="expense-category-suggestions">
                            <option value="Хигиенист"/>
                            <option value="Градинар"/>
                            <option value="Ремонт"/>
                            <option value="Електричество"/>
                            <option value="Вода"/>
                            <option value="Асансьор"/>
                        </datalist>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expense-description">{t.building.expenseDescriptionLabel}</Label>
                        <Textarea id="expense-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="expense-amount">{t.building.expenseAmountLabel}</Label>
                            <Input id="expense-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expense-date">{t.building.expenseDateLabel}</Label>
                            <Input id="expense-date" type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)}/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !category.trim() || !amount || Number(amount) <= 0}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ExpensesPage() {
    const {membership} = useBuildingContext()
    const {expenses, total, loading, error, addExpense} = useExpenses(!!membership)
    const {t, locale} = useI18n()

    if (!membership) return null
    const isAdmin = membership.role === 'admin'

    const exportRows = expenses.map((e) => ({
        [t.building.expenseDateLabel]: e.spent_at,
        [t.building.expenseCategoryLabel]: e.category,
        [t.building.expenseDescriptionLabel]: e.description ?? '',
        [t.building.expenseAmountLabel]: e.amount.toFixed(2),
    }))

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">{t.building.totalSpent}</p>
                    <p className="text-2xl font-bold">{total.toFixed(2)} {t.common.currencySymbol}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t.building.expensesTitle}</CardTitle>
                        <CardDescription>{t.building.expensesDescription}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <ExportButton data={exportRows} filename="razhodi" disabled={expenses.length === 0}/>
                        {isAdmin && <NewExpenseDialog onAdd={addExpense}/>}
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
                    ) : expenses.length === 0 ? (
                        <EmptyState icon={<Coins className="h-6 w-6 text-muted-foreground"/>} description={t.building.noExpensesYet}/>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.building.expenseDateLabel}</TableHead>
                                    <TableHead>{t.building.expenseCategoryLabel}</TableHead>
                                    <TableHead>{t.building.expenseDescriptionLabel}</TableHead>
                                    <TableHead>{t.building.expenseAmountLabel}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((e) => (
                                    <TableRow key={e.id}>
                                        <TableCell>{new Date(e.spent_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US')}</TableCell>
                                        <TableCell className="font-medium">{e.category}</TableCell>
                                        <TableCell className="text-muted-foreground">{e.description ?? '—'}</TableCell>
                                        <TableCell>{e.amount.toFixed(2)} {t.common.currencySymbol}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
