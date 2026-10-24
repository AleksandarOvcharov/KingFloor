import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * GET /api/analytics/stats
 * Returns aggregated dashboard statistics for the authenticated user.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const userId = auth.user.id

        // Step 1: Get user's conversation IDs
        const {data: conversations} = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('user_id', userId)

        const conversationIds = (conversations || []).map(c => c.id)
        const totalConversations = conversationIds.length

        // Step 2: Run remaining queries in parallel
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

        const [messagesResult, recentEventsResult, dailyMessagesResult] = await Promise.all([
            // Total messages across all conversations
            conversationIds.length > 0
                ? supabaseAdmin
                    .from('chat_messages')
                    .select('id, role')
                    .in('conversation_id', conversationIds)
                : Promise.resolve({data: []}),

            // Recent analytics events (last 30)
            supabaseAdmin
                .from('analytics_events')
                .select('id, event_type, event_data, created_at')
                .eq('user_id', userId)
                .order('created_at', {ascending: false})
                .limit(30),

            // Messages in last 14 days for the chart
            conversationIds.length > 0
                ? supabaseAdmin
                    .from('chat_messages')
                    .select('created_at, role')
                    .in('conversation_id', conversationIds)
                    .gte('created_at', fourteenDaysAgo)
                : Promise.resolve({data: []}),
        ])

        // Aggregate messages by day
        const dailyMap = new Map<string, { user: number; model: number }>()
        for (let i = 13; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
            const key = date.toISOString().split('T')[0]
            dailyMap.set(key, {user: 0, model: 0})
        }

        for (const msg of dailyMessagesResult.data || []) {
            const day = msg.created_at.split('T')[0]
            const entry = dailyMap.get(day)
            if (entry) {
                if (msg.role === 'user') entry.user++
                else entry.model++
            }
        }

        const dailyMessages = Array.from(dailyMap.entries()).map(([date, counts]) => ({
            date,
            label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
            sent: counts.user,
            received: counts.model,
        }))

        // Count messages by role
        const allMessages = messagesResult.data || []
        const userMessages = allMessages.filter(m => m.role === 'user').length
        const modelMessages = allMessages.filter(m => m.role === 'model').length

        // Aggregate events by type
        const events = recentEventsResult.data || []
        const eventCounts: Record<string, number> = {}
        for (const event of events) {
            eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
        }

        return NextResponse.json({
            data: {
                totalConversations,
                totalMessages: allMessages.length,
                userMessages,
                modelMessages,
                dailyMessages,
                recentEvents: events,
                eventCounts,
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
