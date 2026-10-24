import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * GET /api/ai/history/messages?conversation_id=...
 * Returns all messages for a conversation owned by the authenticated user.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const conversationId = request.nextUrl.searchParams.get('conversation_id')
        if (!conversationId) {
            return NextResponse.json({error: 'conversation_id is required'}, {status: 400})
        }

        // Verify conversation ownership
        const {data: convo} = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('id', conversationId)
            .eq('user_id', auth.user.id)
            .single()

        if (!convo) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404})
        }

        const {data, error} = await supabaseAdmin
            .from('chat_messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', {ascending: true})

        if (error) {
            return NextResponse.json({error: error.message}, {status: 500})
        }
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/ai/history/messages
 * Saves a message to a conversation owned by the authenticated user.
 *
 * Body: { conversation_id: string, role: 'user' | 'model', content: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const {conversation_id, role, content} = await request.json()
        if (!conversation_id || !role || !content) {
            return NextResponse.json(
                {error: 'conversation_id, role, and content are required'},
                {status: 400}
            )
        }

        // Validate role to prevent arbitrary values being stored
        const VALID_ROLES = ['user', 'model'] as const
        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({error: 'role must be "user" or "model"'}, {status: 400})
        }

        // Verify conversation ownership
        const {data: convo} = await supabaseAdmin
            .from('chat_conversations')
            .select('id, title')
            .eq('id', conversation_id)
            .eq('user_id', auth.user.id)
            .single()

        if (!convo) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404})
        }

        const {data, error} = await supabaseAdmin
            .from('chat_messages')
            .insert({conversation_id, role, content})
            .select('id, role, content, created_at')
            .single()

        if (error) {
            return NextResponse.json({error: error.message}, {status: 500})
        }

        // Update conversation title from first user message & bump updated_at
        if (role === 'user') {
            if (convo.title === 'New Chat') {
                let cleanText = content.replace(/^!\[Image]\([^)]+\)\s*/, '').trim()
                if (!cleanText) cleanText = 'Image Analysis'
                const title = cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText
                await supabaseAdmin
                    .from('chat_conversations')
                    .update({title, updated_at: new Date().toISOString()})
                    .eq('id', conversation_id)
            } else {
                await supabaseAdmin
                    .from('chat_conversations')
                    .update({updated_at: new Date().toISOString()})
                    .eq('id', conversation_id)
            }
        }

        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
