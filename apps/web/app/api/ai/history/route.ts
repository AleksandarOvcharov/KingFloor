import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * GET /api/ai/history
 * Returns all chat conversations for the authenticated user.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const {data, error} = await supabaseAdmin
            .from('chat_conversations')
            .select('id, title, created_at, updated_at')
            .eq('user_id', auth.user.id)
            .order('updated_at', {ascending: false})

        if (error) throw error
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/ai/history
 * Creates a new conversation for the authenticated user.
 *
 * Body: { title?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const body = await request.json()
        const title = body.title || 'New Chat'

        const {data, error} = await supabaseAdmin
            .from('chat_conversations')
            .insert({user_id: auth.user.id, title})
            .select('id, title, created_at, updated_at')
            .single()

        if (error) throw error
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * DELETE /api/ai/history?id=...
 * Deletes a conversation owned by the authenticated user.
 */
export async function DELETE(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const id = request.nextUrl.searchParams.get('id')
        if (!id) {
            return NextResponse.json({error: 'id is required'}, {status: 400})
        }

        // Ensure the conversation belongs to the user
        const {data: convo} = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('id', id)
            .eq('user_id', auth.user.id)
            .single()

        if (!convo) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404})
        }

        const {error} = await supabaseAdmin
            .from('chat_conversations')
            .delete()
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({data: {success: true}})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
