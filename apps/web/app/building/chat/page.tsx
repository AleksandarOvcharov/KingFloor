'use client'

import {useEffect, useRef, useState} from 'react'
import {useAuth} from '@/hooks/useAuth'
import {useBuildingContext} from '@/hooks/building/BuildingContext'
import {useChat} from '@/hooks/building/useChat'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@workspace/ui/ui/card'
import {Button} from '@workspace/ui/ui/button'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {useI18n} from '@/lib/i18n/provider'
import {cn} from '@/lib/utils'
import {MessageCircle, Send} from 'lucide-react'

export default function ChatPage() {
    const {user} = useAuth()
    const {membership} = useBuildingContext()
    const {messages, loading, error, sendMessage} = useChat(!!membership, membership?.building.id)
    const {t, locale} = useI18n()
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight})
    }, [messages.length])

    if (!membership) return null

    const handleSend = async () => {
        const body = draft.trim()
        if (!body || sending) return
        setSending(true)
        setSendError(null)
        const result = await sendMessage(body)
        setSending(false)
        if (!result.success) {
            setSendError(result.error ?? null)
            return
        }
        setDraft('')
    }

    return (
        <Card className="flex flex-col h-[calc(100vh-10rem)]">
            <CardHeader>
                <CardTitle>{t.building.chatTitle}</CardTitle>
                <CardDescription>{t.building.chatDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-2/3"/>
                            <Skeleton className="h-12 w-2/3 ml-auto"/>
                            <Skeleton className="h-12 w-1/2"/>
                        </div>
                    ) : messages.length === 0 ? (
                        <EmptyState icon={<MessageCircle className="h-6 w-6 text-muted-foreground"/>} description={t.building.noMessagesYet}/>
                    ) : (
                        messages.map((m) => {
                            const isMine = m.sender_id === user?.id
                            const initials = (m.sender_name || '?').substring(0, 2).toUpperCase()
                            return (
                                <div key={m.id} className={cn('flex items-end gap-2', isMine && 'flex-row-reverse')}>
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarImage src={m.sender_avatar_url || undefined} alt={m.sender_name || ''}/>
                                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn('max-w-[75%] space-y-0.5', isMine && 'items-end flex flex-col')}>
                                        {!isMine && <p className="text-xs text-muted-foreground px-1">{m.sender_name ?? ''}</p>}
                                        <div
                                            className={cn(
                                                'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                                                isMine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                            )}
                                        >
                                            {m.body}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground px-1">
                                            {new Date(m.created_at).toLocaleTimeString(locale === 'bg' ? 'bg-BG' : 'en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {sendError && <p className="text-sm text-destructive">{sendError}</p>}

                <div className="flex items-end gap-2 pt-2 border-t">
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder={t.building.chatPlaceholder}
                        rows={1}
                        maxLength={2000}
                        className="resize-none min-h-10"
                    />
                    <Button onClick={handleSend} disabled={sending || !draft.trim()} size="icon" className="shrink-0">
                        <Send className="h-4 w-4"/>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
