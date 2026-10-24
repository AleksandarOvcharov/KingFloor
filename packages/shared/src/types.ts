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

// =============================================================================
// KingFloor domain — управление на етажна собственост (condo/HOA management).
// One organization = one Building made directly of Units (no entrance
// layer). Every user has at most one BuildingMember row (one building per
// user in the MVP).
// =============================================================================

export type BuildingRole = 'admin' | 'resident'

export interface Building {
    id: string
    name: string
    address: string | null
    iban: string | null
    invite_code: string
    created_by: string | null
    created_at: string
}

/** A unit still open for a resident to self-join via GET /api/building/lookup. */
export interface JoinableUnit {
    id: string
    number: string
    floor: number | null
    area_sqm: number | null
}

export interface Unit {
    id: string
    building_id: string
    number: string
    floor: number | null
    area_sqm: number | null
    ideal_parts: number | null
    created_at: string
    // Joined fields some endpoints attach:
    resident_name?: string | null
    /** building_members.id for the assigned resident — needed to unassign them. */
    resident_member_id?: string | null
}

export interface BuildingMember {
    id: string
    building_id: string
    user_id: string
    role: BuildingRole
    unit_id: string | null
    created_at: string
    // Joined fields some endpoints attach:
    display_name?: string | null
    unit_number?: string | null
}

/** What GET /api/building returns for the current user. */
export interface BuildingMembership {
    building: Building
    role: BuildingRole
    unit: Unit | null
}

export type FeeStatus = 'unpaid' | 'paid' | 'overdue'

export interface Fee {
    id: string
    building_id: string
    unit_id: string
    period: string // 'YYYY-MM'
    amount: number
    due_date: string | null
    status: FeeStatus
    paid_at: string | null
    created_at: string
    // Joined field:
    unit_number?: string
}

export interface Payment {
    id: string
    fee_id: string
    unit_id: string
    amount: number
    method: string | null
    note: string | null
    recorded_by: string | null
    paid_at: string
}

export interface Announcement {
    id: string
    building_id: string
    author_id: string | null
    title: string
    body: string
    pinned: boolean
    created_at: string
    author_name?: string | null
}

export type PollStatus = 'open' | 'closed'

export interface PollOption {
    id: string
    poll_id: string
    label: string
    position: number
    attachment_url: string | null
    attachment_name: string | null
    vote_count?: number
}

export interface Poll {
    id: string
    building_id: string
    created_by: string | null
    title: string
    description: string | null
    status: PollStatus
    closes_at: string | null
    created_at: string
    options: PollOption[]
    total_votes?: number
    my_vote_option_id?: string | null
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved'
export type IssuePriority = 'low' | 'normal' | 'high'

export interface MaintenanceComment {
    id: string
    issue_id: string
    author_id: string | null
    body: string
    created_at: string
    author_name?: string | null
}

export interface MaintenanceIssue {
    id: string
    building_id: string
    unit_id: string | null
    reported_by: string | null
    title: string
    description: string | null
    status: IssueStatus
    priority: IssuePriority
    created_at: string
    resolved_at: string | null
    unit_number?: string | null
    reporter_name?: string | null
    comment_count?: number
}

// Expenses — the building's own spending (разходи), as opposed to Fee/Payment
// which track money coming IN from residents. Together they make up the
// касова книга (cash book) shown on the admin dashboard.
export interface Expense {
    id: string
    building_id: string
    category: string
    description: string | null
    amount: number
    spent_at: string // 'YYYY-MM-DD'
    recorded_by: string | null
    created_at: string
}

/** One point in the admin dashboard's income-vs-expense chart. */
export interface FinanceMonthPoint {
    period: string // 'YYYY-MM'
    label: string
    income: number
    expense: number
}

export interface ExpenseCategoryTotal {
    category: string
    total: number
}

export type OwnerDuesStatus = 'paid' | 'partial' | 'unpaid'

/** One row of the admin dashboard's "Разпределение на сметки" table. */
export interface OwnerDues {
    user_id: string
    display_name: string
    unit_number: string | null
    total_due: number
    status: OwnerDuesStatus
}

/** GET /api/building/finance-summary — everything the admin dashboard needs in one call. */
export interface FinanceSummary {
    period: string // current 'YYYY-MM'
    collectedThisPeriod: number
    outstandingThisPeriod: number
    outstandingCount: number
    unitCount: number
    cashBalance: number
    cashTotal: number
    onlineTotal: number
    expensesThisMonth: number
    monthlySeries: FinanceMonthPoint[]
    expensesByCategory: ExpenseCategoryTotal[]
    ownerDues: OwnerDues[]
}
