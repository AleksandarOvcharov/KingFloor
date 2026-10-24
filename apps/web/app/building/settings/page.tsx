'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {useI18n} from '@/lib/i18n/provider'
import {Check} from 'lucide-react'

export default function BuildingSettingsPage() {
    const {membership, updateBuilding} = useBuildingContext()
    const {t} = useI18n()
    const [name, setName] = useState(membership?.building.name ?? '')
    const [address, setAddress] = useState(membership?.building.address ?? '')
    const [iban, setIban] = useState(membership?.building.iban ?? '')
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    if (!membership) return null
    if (membership.role !== 'admin') return null

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)
        setSaved(false)
        const result = await updateBuilding({
            name: name.trim(),
            address: address.trim() || null,
            iban: iban.trim() || null,
        })
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="max-w-md space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.building.settingsTitle}</CardTitle>
                    <CardDescription>{t.building.settingsDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="settings-name">{t.building.setupNameLabel}</Label>
                            <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-address">{t.building.setupAddressLabel}</Label>
                            <Input id="settings-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-iban">{t.building.ibanLabel}</Label>
                            <Input
                                id="settings-iban"
                                value={iban}
                                onChange={(e) => setIban(e.target.value.toUpperCase())}
                                placeholder={t.building.ibanPlaceholder}
                                className="font-mono tracking-wide"
                                maxLength={34}
                            />
                            <p className="text-xs text-muted-foreground">{t.building.ibanHint}</p>
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" disabled={submitting || name.trim().length < 2} className="gap-1.5">
                            {saved && <Check className="h-4 w-4"/>}
                            {submitting ? t.common.submitting : saved ? t.building.settingsSaved : t.common.save}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
