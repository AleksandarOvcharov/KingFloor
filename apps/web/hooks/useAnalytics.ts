import {useCallback, useEffect, useState} from 'react'
import type {User} from '@supabase/supabase-js'
import {getAuthHeaders} from '@/lib/api/client'
import type {AnalyticsEvent, DailyMessageStat, DashboardStats} from '@workspace/shared'

export type {AnalyticsEvent, DailyMessageStat, DashboardStats}

interface UseAnalyticsReturn {
    /** Aggregated dashboard statistics */
    stats: DashboardStats | null
    /** Log an analytics event */
    trackEvent: (eventType: string, eventData?: Record<string, unknown>) => Promise<void>
    /** Refresh dashboard stats */
    refreshStats: () => Promise<void>
    /** Whether stats are loading */
    loading: boolean
}

const EMPTY_STATS: DashboardStats = {
    totalConversations: 0,
    totalMessages: 0,
    userMessages: 0,
    modelMessages: 0,
    dailyMessages: [],
    recentEvents: [],
    eventCounts: {},
}

/**
 * Hook for analytics event tracking and dashboard statistics.
 * Loads stats on mount and provides a method to log events.
 */
export function useAnalytics(user: User | null): UseAnalyticsReturn {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchStats = useCallback(async () => {
        if (!user) {
            setStats(EMPTY_STATS)
            return
        }
        setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/analytics/stats', {headers})
            const json = await res.json()
            if (res.ok && json.data) {
                setStats(json.data)
            }
        } catch {
            setStats(EMPTY_STATS)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const trackEvent = useCallback(
        async (eventType: string, eventData?: Record<string, unknown>) => {
            if (!user) return
            try {
                const headers = await getAuthHeaders()
                await fetch('/api/analytics/events', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', ...headers},
                    body: JSON.stringify({
                        event_type: eventType,
                        event_data: eventData || {},
                    }),
                })
            } catch {
                // Silently fail — analytics should never block the user
            }
        },
        [user]
    )

    return {
        stats,
        trackEvent,
        refreshStats: fetchStats,
        loading,
    }
}
