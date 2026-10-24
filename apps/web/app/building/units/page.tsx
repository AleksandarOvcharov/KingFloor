'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useUnits} from '@/hooks/building/useUnits'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@workspace/ui/shadcn/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@workspace/ui/shadcn/alert-dialog'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {Unit} from '@workspace/shared'
import {Pencil, Plus, Trash2, UserX, Users} from 'lucide-react'

interface UnitFormValues {
    number: string
    floor?: number | null
    area_sqm?: number | null
}

function UnitFormDialog({
    trigger,
    title,
    initial,
    onSubmit,
}: {
    trigger: React.ReactNode
    title: string
    initial?: Unit
    onSubmit: (input: UnitFormValues) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [number, setNumber] = useState(initial?.number ?? '')
    const [floor, setFloor] = useState(initial?.floor != null ? String(initial.floor) : '')
    const [area, setArea] = useState(initial?.area_sqm != null ? String(initial.area_sqm) : '')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onSubmit({
            number: number.trim(),
            floor: floor ? Number(floor) : null,
            area_sqm: area ? Number(area) : null,
        })
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        if (!initial) {
            setNumber('')
            setFloor('')
            setArea('')
        }
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="unit-number">{t.building.unitNumberLabel}</Label>
                        <Input id="unit-number" value={number} onChange={(e) => setNumber(e.target.value)}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="unit-floor">{t.building.unitFloorLabel}</Label>
                            <Input id="unit-floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit-area">{t.building.unitAreaLabel}</Label>
                            <Input id="unit-area" type="number" value={area} onChange={(e) => setArea(e.target.value)}/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !number.trim()}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteUnitButton({unit, onDelete}: {unit: Unit; onDelete: (id: string) => Promise<{success: boolean; error?: string}>}) {
    const {t} = useI18n()
    const [error, setError] = useState<string | null>(null)

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5"/>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.building.deleteUnitConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{tFormat(t.building.deleteUnitConfirmDescription, {number: unit.number})}</AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async (e) => {
                            e.preventDefault()
                            const result = await onDelete(unit.id)
                            if (!result.success) setError(result.error ?? null)
                        }}
                    >
                        {t.building.deleteUnit}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function AssignResidentDialog({
    unitId,
    unitNumber,
    onAssign,
}: {
    unitId: string
    unitNumber: string
    onAssign: (email: string, unitId: string) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onAssign(email.trim(), unitId)
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setEmail('')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                    <Users className="h-3.5 w-3.5"/>
                    {t.building.addMember}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.building.addMember} — {unitNumber}</DialogTitle>
                    <DialogDescription>{t.building.memberEmailHint}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="member-email">{t.building.memberEmailLabel}</Label>
                    <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !email.trim()}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RemoveResidentButton({
    name,
    memberId,
    onRemove,
}: {
    name: string
    memberId: string
    onRemove: (memberId: string) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [error, setError] = useState<string | null>(null)

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0">
                    <UserX className="h-3.5 w-3.5"/>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.building.removeResidentConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{tFormat(t.building.removeResidentConfirmDescription, {name})}</AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async (e) => {
                            e.preventDefault()
                            const result = await onRemove(memberId)
                            if (!result.success) setError(result.error ?? null)
                        }}
                    >
                        {t.building.removeResident}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function UnitsPage() {
    const {membership} = useBuildingContext()
    const {units, loading, error, addUnit, updateUnit, deleteUnit, assignResident, unassignResident} = useUnits(!!membership)
    const {t} = useI18n()

    if (!membership) return null

    if (membership.role !== 'admin') {
        return (
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>{t.building.myUnitTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    {membership.unit ? (
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">{t.building.unitNumberLabel}</dt>
                                <dd className="font-medium">{membership.unit.number}</dd>
                            </div>
                            {membership.unit.floor != null && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">{t.building.unitFloorLabel}</dt>
                                    <dd className="font-medium">{membership.unit.floor}</dd>
                                </div>
                            )}
                            {membership.unit.area_sqm != null && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">{t.building.unitAreaLabel}</dt>
                                    <dd className="font-medium">{membership.unit.area_sqm} m²</dd>
                                </div>
                            )}
                        </dl>
                    ) : (
                        <EmptyState description={t.building.unitNoResident}/>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t.building.unitsTitle}</CardTitle>
                        <CardDescription>{units.length}</CardDescription>
                    </div>
                    <UnitFormDialog
                        title={t.building.addUnit}
                        onSubmit={addUnit}
                        trigger={
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4"/>
                                {t.building.addUnit}
                            </Button>
                        }
                    />
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {loading ? (
                        <Skeleton className="h-40 w-full"/>
                    ) : units.length === 0 ? (
                        <EmptyState description={t.building.noUnitsYet}/>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.building.unitNumberLabel}</TableHead>
                                    <TableHead>{t.building.unitFloorLabel}</TableHead>
                                    <TableHead>{t.building.unitAreaLabel}</TableHead>
                                    <TableHead>{t.building.unitResident}</TableHead>
                                    <TableHead/>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {units.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.number}</TableCell>
                                        <TableCell>{u.floor ?? '—'}</TableCell>
                                        <TableCell>{u.area_sqm ?? '—'}</TableCell>
                                        <TableCell>
                                            {u.resident_name ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="truncate">{u.resident_name}</span>
                                                    {u.resident_member_id && (
                                                        <RemoveResidentButton
                                                            name={u.resident_name}
                                                            memberId={u.resident_member_id}
                                                            onRemove={unassignResident}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">{t.building.unitNoResident}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                {!u.resident_name && (
                                                    <AssignResidentDialog unitId={u.id} unitNumber={u.number} onAssign={assignResident}/>
                                                )}
                                                <UnitFormDialog
                                                    title={t.building.editUnit}
                                                    initial={u}
                                                    onSubmit={(input) => updateUnit(u.id, input)}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Pencil className="h-3.5 w-3.5"/>
                                                        </Button>
                                                    }
                                                />
                                                <DeleteUnitButton unit={u} onDelete={deleteUnit}/>
                                            </div>
                                        </TableCell>
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
