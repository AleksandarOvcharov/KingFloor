import {NextRequest, NextResponse} from 'next/server'
import {type ChatMessage, generateChatResponse} from '@/lib/ai/client'
import {SYSTEM_INSTRUCTION} from '@/app/api/ai/config'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * POST /api/ai/chat
 * Multi-turn chat endpoint. Requires authentication.
 *
 * Body: { messages: ChatMessage[], message: string }
 * Response: { data: string } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const {messages, message} = await request.json()

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                {error: 'Message is required and must be a string'},
                {status: 400}
            )
        }

        const history: ChatMessage[] = Array.isArray(messages) ? messages : []

        const text = await generateChatResponse(history, message, {
            systemInstruction: SYSTEM_INSTRUCTION,
        })

        return NextResponse.json({data: text})
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Internal server error'
        const status = errMsg.includes('GEMINI_API_KEY') ? 503 : 500
        return NextResponse.json({error: errMsg}, {status})
    }
}
