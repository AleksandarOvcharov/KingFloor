'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useJoinBuilding} from '@/hooks/building/useJoinBuilding'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@workspace/ui/ui/tabs'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@workspace/ui/ui/select'
import {useI18n} from '@/lib/i18n/provider'
import {Building2} from 'lucide-react'

function CreateBuildingCard() {
    const {createBuilding} = useBuildingContext()
    const {t} = useI18n()
    const router = useRouter()
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        const result = await createBuilding(name.trim(), address.trim() || undefined)
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? 'Failed to create building')
            return
        }
        router.push('/building/units')
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.building.setupTitle}</CardTitle>
                <CardDescription>{t.building.setupDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t.building.setupNameLabel}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t.building.setupNamePlaceholder}
                            required
                            minLength={2}
                            maxLength={120}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">{t.building.setupAddressLabel}</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t.building.setupAddressPlaceholder}
                            maxLength={200}
                        />
                    </div>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={submitting || name.trim().length < 2}>
                        {submitting ? t.common.submitting : t.building.setupSubmit}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function JoinBuildingCard() {
    const {t} = useI18n()
    const router = useRouter()
    const {refetch} = useBuildingContext()
    const {result, loading, lookup, join, reset} = useJoinBuilding()
    const [code, setCode] = useState('')
    const [unitId, setUnitId] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [joining, setJoining] = useState(false)

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        const res = await lookup(code)
        if (!res.success) setError(res.error ?? null)
    }

    const handleJoin = async () => {
        setJoining(true)
        setError(null)
        const res = await join(code, unitId)
        if (!res.success) {
            setJoining(false)
            setError(res.error ?? null)
            return
        }
        // Without this, the shared BuildingContext still has the stale
        // pre-join membership (null), so /building's layout guard sees
        // "no membership" and bounces straight back here — the join
        // succeeded on the server, but the UI looked like it hadn't.
        await refetch()
        setJoining(false)
        router.push('/building')
    }

    const startOver = () => {
        reset()
        setUnitId('')
        setError(null)
    }

    if (!result) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t.building.joinTitle}</CardTitle>
                    <CardDescription>{t.building.joinDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLookup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">{t.building.joinCodeLabel}</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder={t.building.joinCodePlaceholder}
                                maxLength={6}
                                required
                                className="uppercase tracking-widest"
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={loading || code.trim().length < 6}>
                            {loading ? t.common.submitting : t.building.findBuilding}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{result.building.name}</CardTitle>
                {result.building.address && <CardDescription>{result.building.address}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                {result.units.length === 0 ? (
                    <Alert>
                        <AlertDescription>{t.building.noUnitsAvailable}</AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-2">
                        <Label>{t.building.selectUnitLabel}</Label>
                        <Select value={unitId} onValueChange={setUnitId}>
                            <SelectTrigger>
                                <SelectValue placeholder="—"/>
                            </SelectTrigger>
                            <SelectContent>
                                {result.units.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {t.building.unitNumberLabel} {u.number}
                                        {u.floor != null ? ` · ${t.building.unitFloorLabel} ${u.floor}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="flex gap-2">
                    <Button variant="outline" onClick={startOver}>{t.building.changeCode}</Button>
                    <Button className="flex-1" onClick={handleJoin} disabled={joining || !unitId}>
                        {joining ? t.common.submitting : t.building.joinSubmit}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function BuildingSetupPage() {
    const {membership, loading} = useBuildingContext()
    const router = useRouter()
    const {t} = useI18n()

    useEffect(() => {
        if (!loading && membership) router.push('/building')
    }, [loading, membership, router])

    if (!loading && membership) {
        return null
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary"/>
                </div>
            </div>
            <Tabs defaultValue="create">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">{t.building.setupTabCreate}</TabsTrigger>
                    <TabsTrigger value="join">{t.building.setupTabJoin}</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="mt-4">
                    <CreateBuildingCard/>
                </TabsContent>
                <TabsContent value="join" className="mt-4">
                    <JoinBuildingCard/>
                </TabsContent>
            </Tabs>
        </div>
    )
}
