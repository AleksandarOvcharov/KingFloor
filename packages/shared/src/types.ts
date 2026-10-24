// Locale — moved from apps/web/lib/i18n/dictionaries.ts, the single
// source of truth for supported languages across web and mobile.
export const LOCALES = ['en', 'bg'] as const
export type Locale = (typeof LOCALES)[number]

// UserProfile — moved from apps/web/hooks/useProfile.ts, matches the
// `profiles` table shape returned by GET/PUT /api/profile.
export interface UserProfile {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    bio?: string | null
    website?: string | null
    twitter_handle?: string | null
    github_handle?: string | null
    location?: string | null
    is_public: boolean
    created_at: string
    updated_at: string
}

// ChatMessage — moved from apps/web/hooks/useAI.ts. Role values match the
// Gemini API's own 'user' | 'model' convention, not OpenAI's.
export interface ChatMessage {
    role: 'user' | 'model'
    parts: { text: string }[]
    imageUrl?: string
}

// AnalyticsEvent / DailyMessageStat / DashboardStats — moved from
// apps/web/hooks/useAnalytics.ts, matches GET /api/analytics/stats' response
// shape so mobile can render the same dashboard data without reimplementing it.
export interface AnalyticsEvent {
    id: string
    event_type: string
    event_data: Record<string, unknown>
    created_at: string
}

export interface DailyMessageStat {
    date: string
    label: string
    sent: number
    received: number
}

export interface DashboardStats {
    totalConversations: number
    totalMessages: number
    userMessages: number
    modelMessages: number
    dailyMessages: DailyMessageStat[]
    recentEvents: AnalyticsEvent[]
    eventCounts: Record<string, number>
}
