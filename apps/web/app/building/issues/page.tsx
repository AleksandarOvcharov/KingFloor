'use client'

import {useState} from 'react'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useIssues} from '@/hooks/building/useIssues'
import {useIssueComments} from '@/hooks/building/useIssueComments'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Badge} from '@workspace/ui/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@workspace/ui/ui/select'
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
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {IssuePriority, IssueStatus, MaintenanceIssue} from '@workspace/shared'
import {MessageSquare, Plus, Wrench} from 'lucide-react'

function priorityVariant(p: IssuePriority): 'default' | 'secondary' | 'destructive' {
    if (p === 'high') return 'destructive'
    if (p === 'low') return 'secondary'
    return 'default'
}

function statusVariant(s: IssueStatus): 'default' | 'secondary' | 'outline' {
    if (s === 'resolved') return 'secondary'
    if (s === 'in_progress') return 'default'
    return 'outline'
}

function ReportIssueDialog({
    onReport,
}: {
    onReport: (input: {title: string; description?: string; priority?: IssuePriority}) => Promise<{success: boolean; error?: string}>
}) {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<IssuePriority>('normal')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setSubmitting(true)
        const result = await onReport({title: title.trim(), description: description.trim() || undefined, priority})
        setSubmitting(false)
        if (!result.success) {
            setError(result.error ?? null)
            return
        }
        setTitle('')
        setDescription('')
        setPriority('normal')
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4"/>
                    {t.building.reportIssue}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t.building.reportIssue}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="issue-title">{t.building.issueTitleLabel}</Label>
                        <Input id="issue-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="issue-desc">{t.building.issueDescriptionLabel}</Label>
                        <Textarea id="issue-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000}/>
                    </div>
                    <div className="space-y-2">
                        <Label>{t.building.priorityLabel}</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as IssuePriority)}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">{t.building.priorityLow}</SelectItem>
                                <SelectItem value="normal">{t.building.priorityNormal}</SelectItem>
                                <SelectItem value="high">{t.building.priorityHigh}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={submit} disabled={submitting || !title.trim()}>
                        {t.common.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function IssueComments({issueId, onCommentAdded}: {issueId: string; onCommentAdded: () => void}) {
    const {t, locale} = useI18n()
    const {comments, loading, error, addComment} = useIssueComments(issueId, true)
    const [body, setBody] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        if (!body.trim()) return
        setSubmitting(true)
        const result = await addComment(body.trim())
        setSubmitting(false)
        if (result.success) {
            setBody('')
            onCommentAdded()
        }
    }

    return (
        <div className="space-y-3 border-t pt-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading ? (
                <Skeleton className="h-12 w-full"/>
            ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.building.noCommentsYet}</p>
            ) : (
                <div className="space-y-2.5">
                    {comments.map((c) => (
                        <div key={c.id} className="text-sm">
                            <div className="flex items-baseline gap-2">
                                <span className="font-medium">{c.author_name ?? '—'}</span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(c.created_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                                </span>
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap">{c.body}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
                <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t.building.commentPlaceholder}
                    maxLength={1000}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit()
                    }}
                />
                <Button size="sm" onClick={submit} disabled={submitting || !body.trim()}>
                    {t.building.addComment}
                </Button>
            </div>
        </div>
    )
}

function IssueRow({
    issue,
    isAdmin,
    onUpdateStatus,
    onCommentsChanged,
}: {
    issue: MaintenanceIssue
    isAdmin: boolean
    onUpdateStatus: (id: string, status: IssueStatus) => Promise<{success: boolean; error?: string}>
    onCommentsChanged: () => void
}) {
    const {t, locale} = useI18n()
    const [showComments, setShowComments] = useState(false)
    const statusLabel = {
        open: t.building.issueStatusOpen,
        in_progress: t.building.issueStatusInProgress,
        resolved: t.building.issueStatusResolved,
    }[issue.status]

    return (
        <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="font-medium text-sm">{issue.title}</h3>
                    {issue.description && <p className="text-sm text-muted-foreground mt-0.5">{issue.description}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                    <Badge variant={priorityVariant(issue.priority)}>{issue.priority}</Badge>
                    <Badge variant={statusVariant(issue.status)}>{statusLabel}</Badge>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                {issue.unit_number && `${issue.unit_number} · `}
                {issue.reporter_name ?? ''} · {new Date(issue.created_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US')}
            </p>
            <div className="flex items-center gap-2">
                {isAdmin && issue.status !== 'resolved' && (
                    <Select value={issue.status} onValueChange={(v) => onUpdateStatus(issue.id, v as IssueStatus)}>
                        <SelectTrigger className="w-48">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">{t.building.issueStatusOpen}</SelectItem>
                            <SelectItem value="in_progress">{t.building.issueStatusInProgress}</SelectItem>
                            <SelectItem value="resolved">{t.building.issueStatusResolved}</SelectItem>
                        </SelectContent>
                    </Select>
                )}
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setShowComments((v) => !v)}>
                    <MessageSquare className="h-3.5 w-3.5"/>
                    {tFormat(t.building.commentsCount, {count: issue.comment_count ?? 0})}
                </Button>
            </div>
            {showComments && <IssueComments issueId={issue.id} onCommentAdded={onCommentsChanged}/>}
        </div>
    )
}

export default function IssuesPage() {
    const {membership} = useBuildingContext()
    const {issues, loading, error, reportIssue, updateStatus, refetch} = useIssues(!!membership)
    const {t} = useI18n()

    if (!membership) return null
    const isAdmin = membership.role === 'admin'

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.building.issuesTitle}</CardTitle>
                <ReportIssueDialog onReport={reportIssue}/>
            </CardHeader>
            <CardContent className="space-y-3">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {loading ? (
                    <Skeleton className="h-32 w-full"/>
                ) : issues.length === 0 ? (
                    <EmptyState icon={<Wrench className="h-6 w-6 text-muted-foreground"/>} description={t.building.noIssuesYet}/>
                ) : (
                    issues.map((i) => <IssueRow key={i.id} issue={i} isAdmin={isAdmin} onUpdateStatus={updateStatus} onCommentsChanged={refetch}/>)
                )}
            </CardContent>
        </Card>
    )
}
