'use client'

import {useRef, useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {usePolls} from '@/hooks/building/usePolls'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Badge} from '@workspace/ui/ui/badge'
import {RadioGroup, RadioGroupItem} from '@workspace/ui/shadcn/radio-group'
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
import {FileUpload} from '@/components/upload'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {Poll} from '@workspace/shared'
import {Paperclip, Plus, Trash2, Vote, X} from 'lucide-react'

interface OptionDraft {
    label: string
    attachment: {url: string; name: string} | null
}

function OptionAttachment({buildingId, optionIndex, attachment, onChange}: {
    buildingId: string
    optionIndex: number
    attachment: {url: string; name: string} | null
    onChange: (attachment: {url: string; name: string} | null) => void
}) {
    const {t} = useI18n()
    const [showUpload, setShowUpload] = useState(false)
    const fileNameRef = useRef<string | null>(null)

    if (attachment) {
        return (
            <div className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 truncate text-muted-foreground">
                    <Paperclip className="h-3 w-3 shrink-0"/>
                    <span className="truncate">{attachment.name}</span>
                </span>
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={() => onChange(null)}>
                    {t.building.removeAttachment}
                </Button>
            </div>
        )
    }

    if (showUpload) {
        return (
            <FileUpload
                validation="document"
                compact
                autoUpload
                uploadOptions={{bucket: 'poll-attachments', path: `${buildingId}/${Date.now()}-${optionIndex}`}}
                onUploadComplete={(result) => {
                    if (result.success && result.url) {
                        onChange({url: result.url, name: fileNameRef.current ?? 'document'})
                        setShowUpload(false)
                    }
                }}
                onFileSelect={(file) => {
                    fileNameRef.current = file.name
                }}
            />
        )
    }

    return (
        <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
            <Paperclip className="h-3 w-3"/>
            {t.building.attachDocument}
        </button>
    )
}

function NewPollDialog({
    buildingId,
    onCreate,
}: {
    buildingId: string
    onCreate: (input: {title: string; description?: string; options: {label: string; attachment_url?: string; attachment_name?: string}[]}) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [options, setOptions] = useState<OptionDraft[]>([{label: '', attachment: null}, {label: '', attachment: null}])
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const setOptionLabel = (i: number, value: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? {...o, label: value} : o)))
    const setOptionAttachment = (i: number, attachment: {url: string; name: string} | null) =>
        setOptions((prev) => prev.map((o, idx) => (idx === i ? {...o, attachment} : o)))
    const addOption = () => setOptions((prev) => [...prev, {label: '', attachment: null}])
    const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i))

    const submit = async () => {
        setSubmitting(true)
        const cleanOptions = options
            .filter((o) => o.label.trim())
            .map((o) => ({
                label: o.label.trim(),
                attachment_url: o.attachment?.url,
                attachment_name: o.attachment?.name,
            }))
        const result = await onCreate({title: title.trim(), description: description.trim() || undefined, options: cleanOptions})
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setTitle('')
        setDescription('')
        setOptions([{label: '', attachment: null}, {label: '', attachment: null}])
        setOpen(false)
    }

    const validOptionCount = options.filter((o) => o.label.trim()).length

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4"/>
                    {t.building.newPoll}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.building.newPoll}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label htmlFor="poll-title">{t.building.pollTitleLabel}</Label>
                        <Input id="poll-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="poll-desc">{t.building.announcementBodyLabel}</Label>
                        <Textarea id="poll-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000}/>
                    </div>
                    <div className="space-y-3">
                        <Label>{t.building.pollOptionsLabel}</Label>
                        {options.map((o, i) => (
                            <div key={i} className="space-y-1.5 rounded-md border p-2.5">
                                <div className="flex gap-2">
                                    <Input value={o.label} onChange={(e) => setOptionLabel(i, e.target.value)} maxLength={100} placeholder={`${t.building.pollOptionsLabel} ${i + 1}`}/>
                                    {options.length > 2 && (
                                        <Button variant="ghost" size="icon" onClick={() => removeOption(i)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                                <OptionAttachment
                                    buildingId={buildingId}
                                    optionIndex={i}
                                    attachment={o.attachment}
                                    onChange={(attachment) => setOptionAttachment(i, attachment)}
                                />
                            </div>
                        ))}
                        {options.length < 8 && (
                            <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
                                <Plus className="h-3.5 w-3.5"/>
                                {t.building.addOption}
                            </Button>
                        )}
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !title.trim() || validOptionCount < 2}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PollCard({
    poll,
    isAdmin,
    canVote,
    onVote,
    onClose,
    onDelete,
}: {
    poll: Poll
    isAdmin: boolean
    canVote: boolean
    onVote: (pollId: string, optionId: string) => Promise<{success: boolean; error?: string}>
    onClose: (pollId: string) => Promise<{success: boolean; error?: string}>
    onDelete: (pollId: string) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [selected, setSelected] = useState(poll.my_vote_option_id ?? '')
    const [error, setError] = useState<string | null>(null)
    const total = poll.total_votes ?? 0

    const submitVote = async () => {
        if (!selected) return
        const result = await onVote(poll.id, selected)
        if (!result.success) setError(result.error ?? null)
    }

    return (
        <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="font-medium text-sm">{poll.title}</h3>
                    {poll.description && <p className="text-sm text-muted-foreground mt-0.5">{poll.description}</p>}
                </div>
                <Badge variant={poll.status === 'open' ? 'default' : 'secondary'}>
                    {poll.status === 'open' ? t.building.pollStatusOpen : t.building.pollClosed}
                </Badge>
            </div>

            {poll.status === 'open' && canVote ? (
                <div className="space-y-2">
                    <RadioGroup value={selected} onValueChange={setSelected}>
                        {poll.options.map((o) => (
                            <div key={o.id} className="flex items-center gap-2">
                                <RadioGroupItem value={o.id} id={o.id}/>
                                <Label htmlFor={o.id} className="font-normal text-sm">{o.label}</Label>
                                {o.attachment_url && (
                                    <a
                                        href={o.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                        title={o.attachment_name || t.building.viewAttachment}
                                    >
                                        <Paperclip className="h-3 w-3"/>
                                    </a>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">{tFormat(t.building.votesCount, {count: o.vote_count ?? 0})}</span>
                            </div>
                        ))}
                    </RadioGroup>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button size="sm" onClick={submitVote} disabled={!selected || selected === poll.my_vote_option_id}>
                        {poll.my_vote_option_id ? t.building.changeVote : t.building.castVote}
                    </Button>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {poll.options.map((o) => {
                        const pct = total > 0 ? Math.round(((o.vote_count ?? 0) / total) * 100) : 0
                        return (
                            <div key={o.id} className="space-y-1">
                                <div className="flex justify-between text-sm gap-2">
                                    <span className="flex items-center gap-1.5 truncate">
                                        {o.label}
                                        {o.attachment_url && (
                                            <a
                                                href={o.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline shrink-0"
                                                title={o.attachment_name || t.building.viewAttachment}
                                            >
                                                <Paperclip className="h-3 w-3"/>
                                            </a>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground shrink-0">{pct}% ({o.vote_count ?? 0})</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div className="h-full bg-primary" style={{width: `${pct}%`}}/>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {isAdmin && (
                <div className="flex items-center gap-2">
                    {poll.status === 'open' && (
                        <Button variant="outline" size="sm" onClick={() => onClose(poll.id)}>
                            {t.building.closePoll}
                        </Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t.building.deletePollConfirmTitle}</AlertDialogTitle>
                                <AlertDialogDescription>{t.building.deletePollConfirmDescription}</AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        const result = await onDelete(poll.id)
                                        if (!result.success) setDeleteError(result.error ?? null)
                                    }}
                                >
                                    {t.common.delete}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    )
}

export default function PollsPage() {
    const {membership} = useBuildingContext()
    const {polls, loading, error, createPoll, castVote, closePoll, deletePoll} = usePolls(!!membership)
    const {t} = useI18n()

    if (!membership) return null
    const isAdmin = membership.role === 'admin'

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.building.pollsTitle}</CardTitle>
                {isAdmin && <NewPollDialog buildingId={membership.building.id} onCreate={createPoll}/>}
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {loading ? (
                    <Skeleton className="h-32 w-full"/>
                ) : polls.length === 0 ? (
                    <EmptyState icon={<Vote className="h-6 w-6 text-muted-foreground"/>} description={t.building.noPollsYet}/>
                ) : (
                    polls.map((p) => (
                        <PollCard key={p.id} poll={p} isAdmin={isAdmin} canVote={!!membership.unit} onVote={castVote} onClose={closePoll} onDelete={deletePoll}/>
                    ))
                )}
            </CardContent>
            {!isAdmin && !membership.unit && polls.length > 0 && (
                <CardDescription className="px-6 pb-4">{t.building.needUnitToVote}</CardDescription>
            )}
        </Card>
    )
}
