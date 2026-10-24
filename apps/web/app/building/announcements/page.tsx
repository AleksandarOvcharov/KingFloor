'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useAnnouncements} from '@/hooks/building/useAnnouncements'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Badge} from '@workspace/ui/ui/badge'
import {Checkbox} from '@workspace/ui/shadcn/checkbox'
import {
    Dialog,
    DialogContent,
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
import {useI18n} from '@/lib/i18n/provider'
import type {Announcement} from '@workspace/shared'
import {Megaphone, Pencil, Pin, PinOff, Plus, Trash2} from 'lucide-react'

interface AnnouncementFormValues {
    title: string
    body: string
    pinned: boolean
}

function AnnouncementFormDialog({
    trigger,
    title,
    initial,
    onSubmit,
}: {
    trigger: React.ReactNode
    title: string
    initial?: Announcement
    onSubmit: (input: AnnouncementFormValues) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [titleValue, setTitleValue] = useState(initial?.title ?? '')
    const [body, setBody] = useState(initial?.body ?? '')
    const [pinned, setPinned] = useState(initial?.pinned ?? false)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onSubmit({title: titleValue.trim(), body: body.trim(), pinned})
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        if (!initial) {
            setTitleValue('')
            setBody('')
            setPinned(false)
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
                        <Label htmlFor="ann-title">{t.building.announcementTitleLabel}</Label>
                        <Input id="ann-title" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} maxLength={120}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ann-body">{t.building.announcementBodyLabel}</Label>
                        <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={4000}/>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="ann-pinned" checked={pinned} onCheckedChange={(v) => setPinned(v === true)}/>
                        <Label htmlFor="ann-pinned" className="font-normal">{t.building.pinAnnouncement}</Label>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !titleValue.trim() || !body.trim()}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteAnnouncementButton({id, onDelete}: {id: string; onDelete: (id: string) => Promise<{success: boolean; error?: string}>}) {
    const {t} = useI18n()
    const [error, setError] = useState<string | null>(null)

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5"/>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.building.deleteAnnouncementConfirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.building.deleteAnnouncementConfirmDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async (e) => {
                            e.preventDefault()
                            const result = await onDelete(id)
                            if (!result.success) setError(result.error ?? null)
                        }}
                    >
                        {t.common.delete}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function AnnouncementsPage() {
    const {membership} = useBuildingContext()
    const {announcements, loading, error, createAnnouncement, updateAnnouncement, deleteAnnouncement} = useAnnouncements(!!membership)
    const {t, locale} = useI18n()

    if (!membership) return null
    const isAdmin = membership.role === 'admin'

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.building.announcementsTitle}</CardTitle>
                {isAdmin && (
                    <AnnouncementFormDialog
                        title={t.building.newAnnouncement}
                        onSubmit={createAnnouncement}
                        trigger={
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4"/>
                                {t.building.newAnnouncement}
                            </Button>
                        }
                    />
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {loading ? (
                    <Skeleton className="h-32 w-full"/>
                ) : announcements.length === 0 ? (
                    <EmptyState icon={<Megaphone className="h-6 w-6 text-muted-foreground"/>} description={t.building.noAnnouncementsYet}/>
                ) : (
                    announcements.map((a) => (
                        <div key={a.id} className="rounded-lg border p-4 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {a.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0"/>}
                                    <h3 className="font-medium text-sm truncate">{a.title}</h3>
                                    {a.pinned && <Badge variant="outline" className="text-xs shrink-0">{t.building.pinnedBadge}</Badge>}
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground"
                                            onClick={() => updateAnnouncement(a.id, {pinned: !a.pinned})}
                                            title={a.pinned ? t.building.unpinAnnouncement : t.building.pinAnnouncement}
                                        >
                                            {a.pinned ? <PinOff className="h-3.5 w-3.5"/> : <Pin className="h-3.5 w-3.5"/>}
                                        </Button>
                                        <AnnouncementFormDialog
                                            title={t.building.editAnnouncement}
                                            initial={a}
                                            onSubmit={(input) => updateAnnouncement(a.id, input)}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Pencil className="h-3.5 w-3.5"/>
                                                </Button>
                                            }
                                        />
                                        <DeleteAnnouncementButton id={a.id} onDelete={deleteAnnouncement}/>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                            <p className="text-xs text-muted-foreground">
                                {a.author_name ?? ''} · {new Date(a.created_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US')}
                            </p>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
