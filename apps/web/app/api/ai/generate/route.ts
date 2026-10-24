import {NextRequest, NextResponse} from 'next/server'
import {generateText} from '@/lib/ai/client'
import {SYSTEM_INSTRUCTION} from '@/app/api/ai/config'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * POST /api/ai/generate
 * Simple text generation endpoint. Requires authentication.
 *
 * Body: { prompt: string }
 * Response: { data: string } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const {prompt} = await request.json()

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                {error: 'Prompt is required and must be a string'},
                {status: 400}
            )
        }

        const text = await generateText(prompt, {systemInstruction: SYSTEM_INSTRUCTION})

        return NextResponse.json({data: text})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = message.includes('GEMINI_API_KEY') ? 503 : 500
        return NextResponse.json({error: message}, {status})
    }
}
