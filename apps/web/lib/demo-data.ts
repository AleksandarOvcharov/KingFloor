/**
 * Demo / mock data for hackathon quick-start.
 *
 * Use these in components when prototyping without a backend,
 * or pass them to the seed script to populate Supabase.
 */

/* ─── Users ─── */

export interface DemoUser {
    id: string
    email: string
    username: string
    bio: string
    avatar_url: string | null
}

export const demoUsers: DemoUser[] = [
    {id: 'user-001', email: 'alice@example.com', username: 'alice', bio: 'Full-stack developer. Coffee enthusiast.', avatar_url: null},
    {id: 'user-002', email: 'bob@example.com', username: 'bob', bio: 'Designer who codes. Pixel perfectionist.', avatar_url: null},
    {id: 'user-003', email: 'carol@example.com', username: 'carol', bio: 'PM by day, hackathon hacker by night.', avatar_url: null},
    {id: 'user-004', email: 'dave@example.com', username: 'dave', bio: 'ML engineer exploring web development.', avatar_url: null},
    {id: 'user-005', email: 'eve@example.com', username: 'eve', bio: 'Security researcher and open-source contributor.', avatar_url: null},
]

/* ─── Chat Conversations ─── */

export interface DemoConversation {
    id: string
    user_id: string
    title: string
    created_at: string
}

export const demoConversations: DemoConversation[] = [
    {id: 'conv-001', user_id: 'user-001', title: 'Getting started with Next.js', created_at: '2025-03-20T10:00:00Z'},
    {id: 'conv-002', user_id: 'user-001', title: 'Tailwind CSS tips', created_at: '2025-03-21T14:30:00Z'},
    {id: 'conv-003', user_id: 'user-002', title: 'Design system questions', created_at: '2025-03-22T09:15:00Z'},
    {id: 'conv-004', user_id: 'user-003', title: 'Project planning help', created_at: '2025-03-22T16:00:00Z'},
]

/* ─── Chat Messages ─── */

export interface DemoMessage {
    id: string
    conversation_id: string
    role: 'user' | 'model'
    content: string
    created_at: string
}

export const demoMessages: DemoMessage[] = [
    {id: 'msg-001', conversation_id: 'conv-001', role: 'user', content: 'How do I create a new page in Next.js App Router?', created_at: '2025-03-20T10:00:00Z'},
    {id: 'msg-002', conversation_id: 'conv-001', role: 'model', content: 'Create a folder inside `app/` with a `page.tsx` file. For example, `app/about/page.tsx` creates the `/about` route automatically.', created_at: '2025-03-20T10:00:05Z'},
    {id: 'msg-003', conversation_id: 'conv-001', role: 'user', content: 'What about dynamic routes?', created_at: '2025-03-20T10:01:00Z'},
    {id: 'msg-004', conversation_id: 'conv-001', role: 'model', content: 'Use bracket syntax: `app/posts/[id]/page.tsx`. The `id` param is available via the `params` prop.', created_at: '2025-03-20T10:01:05Z'},
    {id: 'msg-005', conversation_id: 'conv-002', role: 'user', content: 'How do I customize colors in Tailwind v4?', created_at: '2025-03-21T14:30:00Z'},
    {id: 'msg-006', conversation_id: 'conv-002', role: 'model', content: 'In Tailwind v4, use the CSS-first config. Edit the `@theme` block in your `globals.css` and define HSL custom properties.', created_at: '2025-03-21T14:30:05Z'},
    {id: 'msg-007', conversation_id: 'conv-003', role: 'user', content: 'What color system does shadcn/ui use?', created_at: '2025-03-22T09:15:00Z'},
    {id: 'msg-008', conversation_id: 'conv-003', role: 'model', content: 'shadcn/ui uses HSL CSS variables defined in your theme. Light and dark mode each have their own set of values for background, foreground, primary, etc.', created_at: '2025-03-22T09:15:05Z'},
]

/* ─── Analytics Events ─── */

export interface DemoAnalyticsEvent {
    id: string
    user_id: string
    event_type: string
    event_data: Record<string, unknown>
    created_at: string
}

const now = new Date()
function daysAgo(n: number): string {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return d.toISOString()
}

export const demoAnalyticsEvents: DemoAnalyticsEvent[] = [
    {id: 'evt-001', user_id: 'user-001', event_type: 'message_sent', event_data: {conversation_id: 'conv-001'}, created_at: daysAgo(0)},
    {id: 'evt-002', user_id: 'user-001', event_type: 'message_received', event_data: {conversation_id: 'conv-001'}, created_at: daysAgo(0)},
    {id: 'evt-003', user_id: 'user-001', event_type: 'message_sent', event_data: {conversation_id: 'conv-002'}, created_at: daysAgo(1)},
    {id: 'evt-004', user_id: 'user-001', event_type: 'message_received', event_data: {conversation_id: 'conv-002'}, created_at: daysAgo(1)},
    {id: 'evt-005', user_id: 'user-001', event_type: 'conversation_created', event_data: {title: 'Getting started'}, created_at: daysAgo(2)},
    {id: 'evt-006', user_id: 'user-002', event_type: 'message_sent', event_data: {conversation_id: 'conv-003'}, created_at: daysAgo(2)},
    {id: 'evt-007', user_id: 'user-002', event_type: 'message_received', event_data: {conversation_id: 'conv-003'}, created_at: daysAgo(2)},
    {id: 'evt-008', user_id: 'user-001', event_type: 'profile_updated', event_data: {field: 'username'}, created_at: daysAgo(3)},
    {id: 'evt-009', user_id: 'user-003', event_type: 'conversation_created', event_data: {title: 'Project planning'}, created_at: daysAgo(4)},
    {id: 'evt-010', user_id: 'user-001', event_type: 'message_sent', event_data: {conversation_id: 'conv-001'}, created_at: daysAgo(5)},
    {id: 'evt-011', user_id: 'user-001', event_type: 'message_received', event_data: {conversation_id: 'conv-001'}, created_at: daysAgo(5)},
    {id: 'evt-012', user_id: 'user-002', event_type: 'message_sent', event_data: {conversation_id: 'conv-003'}, created_at: daysAgo(6)},
    {id: 'evt-013', user_id: 'user-004', event_type: 'profile_updated', event_data: {field: 'bio'}, created_at: daysAgo(7)},
    {id: 'evt-014', user_id: 'user-001', event_type: 'message_sent', event_data: {conversation_id: 'conv-001'}, created_at: daysAgo(8)},
    {id: 'evt-015', user_id: 'user-005', event_type: 'conversation_created', event_data: {title: 'Security review'}, created_at: daysAgo(10)},
]

/* ─── Dashboard Stats (pre-computed for UI demos) ─── */

export const demoDashboardStats = {
    totalConversations: 4,
    totalMessages: 8,
    userMessages: 4,
    modelMessages: 4,
    recentEvents: demoAnalyticsEvents.slice(0, 5),
    dailyMessages: Array.from({length: 14}, (_, i) => ({
        date: daysAgo(13 - i).split('T')[0],
        sent: Math.floor(Math.random() * 5) + 1,
        received: Math.floor(Math.random() * 5) + 1,
    })),
    eventCounts: {
        message_sent: 5,
        message_received: 4,
        conversation_created: 3,
        profile_updated: 2,
    },
}

/* ─── Sample items for list/table demos ─── */

export const demoProducts = [
    {id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 79.99, stock: 42},
    {id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 149.99, stock: 18},
    {id: 3, name: 'Standing Desk', category: 'Furniture', price: 499.99, stock: 7},
    {id: 4, name: 'Ergonomic Chair', category: 'Furniture', price: 349.99, stock: 12},
    {id: 5, name: 'USB-C Hub', category: 'Accessories', price: 39.99, stock: 85},
    {id: 6, name: 'Webcam HD', category: 'Electronics', price: 69.99, stock: 31},
    {id: 7, name: 'Desk Lamp', category: 'Accessories', price: 29.99, stock: 56},
    {id: 8, name: 'Monitor Stand', category: 'Furniture', price: 89.99, stock: 23},
]

export const demoTeamMembers = [
    {id: 1, name: 'Alice Johnson', role: 'Lead Developer', status: 'active' as const, tasksCompleted: 24},
    {id: 2, name: 'Bob Smith', role: 'UI Designer', status: 'active' as const, tasksCompleted: 18},
    {id: 3, name: 'Carol White', role: 'Product Manager', status: 'away' as const, tasksCompleted: 31},
    {id: 4, name: 'Dave Brown', role: 'Backend Developer', status: 'active' as const, tasksCompleted: 22},
    {id: 5, name: 'Eve Davis', role: 'QA Engineer', status: 'offline' as const, tasksCompleted: 15},
]

export interface DemoNotification {
    id: number
    title: string
    description: string
    time: string
    read: boolean
    avatar?: string
    avatarFallback?: string
    status?: 'default' | 'info' | 'success' | 'warning' | 'error'
    actionLabel?: string
}

export const demoNotifications: DemoNotification[] = [
    {
        id: 1,
        title: 'Gym Chad',
        description: '6 months ago you said tomorrow. Still in couch?',
        time: '30d',
        read: false,
        avatar: '/chad.jpg',
        avatarFallback: '💪',
        status: 'warning',
        actionLabel: 'Hit the Gym',
    },
    {
        id: 2,
        title: 'Build succeeded',
        description: 'Deploy to production edge network completed in 1.4s',
        time: '15 min ago',
        read: false,
        status: 'success',
        avatarFallback: '🚀',
        actionLabel: 'View logs',
    },
    {
        id: 3,
        title: 'Security Alert',
        description: 'New login detected from Berlin, Germany (IP: 192.0.2.1)',
        time: '28 min ago',
        read: false,
        status: 'warning',
        avatarFallback: '🛡️',
        actionLabel: 'Review',
    },
    {
        id: 4,
        title: 'New comment on your PR',
        description: 'Alice left a review on #142: "Looks great, ready to merge!"',
        time: '1 hour ago',
        read: true,
        avatarFallback: 'AJ',
        status: 'info',
    },
    {
        id: 5,
        title: 'Sprint review',
        description: 'Sprint 12 review is scheduled for Friday at 10:00 AM',
        time: '3 hours ago',
        read: true,
        avatarFallback: '📅',
    },
]
