'use client'

import {Bot, Image, LogIn, type LucideIcon, MessageSquare, Trash2, UserCog} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import type {AnalyticsEvent} from '@/hooks/useAnalytics'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {Dictionary, Locale} from '@/lib/i18n/dictionaries'

function getEventConfig(t: Dictionary): Record<string, { icon: LucideIcon; label: string; color: string }> {
    return {
        'page_view': {icon: LogIn, label: t.activity.eventPageView, color: 'text-blue-500'},
        'chat_message': {icon: MessageSquare, label: t.activity.eventChatMessage, color: 'text-success'},
        'chat_created': {icon: Bot, label: t.activity.eventChatCreated, color: 'text-violet-500'},
        'chat_deleted': {icon: Trash2, label: t.activity.eventChatDeleted, color: 'text-destructive'},
        'profile_updated': {icon: UserCog, label: t.activity.eventProfileUpdated, color: 'text-amber-500'},
        'avatar_uploaded': {icon: Image, label: t.activity.eventAvatarUploaded, color: 'text-pink-500'},
        'login': {icon: LogIn, label: t.activity.eventSignedIn, color: 'text-success'},
        'logout': {icon: LogIn, label: t.activity.eventSignedOut, color: 'text-muted-foreground'},
    }
}

function formatTimeAgo(dateString: string, t: Dictionary, locale: Locale): string {
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const diff = now - then

    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t.activity.justNow
    if (minutes < 60) return tFormat(t.activity.minutesAgo, {n: minutes})

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return tFormat(t.activity.hoursAgo, {n: hours})

    const days = Math.floor(hours / 24)
    if (days < 7) return tFormat(t.activity.daysAgo, {n: days})

    return new Date(dateString).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    })
}

interface ActivityFeedProps {
    events: AnalyticsEvent[]
}

export function ActivityFeed({events}: ActivityFeedProps) {
    const {t, locale} = useI18n()
    const eventConfig = getEventConfig(t)

    return (
        <Card className="animate-fade-in">
            <CardHeader>
                <CardTitle>{t.activity.recentActivity}</CardTitle>
                <CardDescription>{t.activity.recentActivityDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t.activity.noActivity}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {events.slice(0, 10).map((event) => {
                            const config = eventConfig[event.event_type] || {
                                icon: MessageSquare,
                                label: event.event_type.replace(/_/g, ' '),
                                color: 'text-muted-foreground',
                            }
                            const Icon = config.icon
                            const detail =
                                (event.event_data as Record<string, string>)?.detail ||
                                (event.event_data as Record<string, string>)?.page ||
                                ''

                            return (
                                <div key={event.id} className="flex items-center gap-3">
                                    <div className={`shrink-0 ${config.color}`}>
                                        <Icon className="h-4 w-4"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{config.label}</p>
                                        {detail && (
                                            <p className="text-xs text-muted-foreground truncate">{detail}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                    {formatTimeAgo(event.created_at, t, locale)}
                  </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
