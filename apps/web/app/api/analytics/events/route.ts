import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * GET /api/analytics/events?limit=...&event_type=...
 * Returns recent analytics events for the authenticated user.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)
        const limit = Math.min(isNaN(rawLimit) ? 20 : rawLimit, 100)
        const eventType = request.nextUrl.searchParams.get('event_type')

        let query = supabaseAdmin
            .from('analytics_events')
            .select('id, event_type, event_data, created_at')
            .eq('user_id', auth.user.id)
            .order('created_at', {ascending: false})
            .limit(limit)

        if (eventType) {
            query = query.eq('event_type', eventType)
        }

        const {data, error} = await query
        if (error) throw error

        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/analytics/events
 * Logs an analytics event for the authenticated user.
 *
 * Body: { event_type: string, event_data?: object }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const {event_type, event_data} = await request.json()

        if (!event_type) {
            return NextResponse.json(
                {error: 'event_type is required'},
                {status: 400}
            )
        }

        const {data, error} = await supabaseAdmin
            .from('analytics_events')
            .insert({user_id: auth.user.id, event_type, event_data: event_data || {}})
            .select('id, event_type, event_data, created_at')
            .single()

        if (error) throw error
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
