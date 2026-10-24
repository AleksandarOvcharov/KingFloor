import {NextRequest, NextResponse} from 'next/server'
import {generateStructured, type Schema} from '@/lib/ai/client'
import {SYSTEM_INSTRUCTION} from '@/app/api/ai/config'
import {authenticateRequest} from '@/lib/api/auth'

/**
 * POST /api/ai/structured
 * Structured JSON generation endpoint using Gemini responseSchema. Requires authentication.
 *
 * Body: { prompt: string, schema: Schema, systemInstruction?: string }
 * Response: { data: T } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const body = await request.json()
        const {prompt, schema, systemInstruction} = body

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                {error: 'Prompt is required and must be a non-empty string'},
                {status: 400}
            )
        }

        if (!schema || typeof schema !== 'object') {
            return NextResponse.json(
                {error: 'Schema is required and must be a valid schema object'},
                {status: 400}
            )
        }

        const data = await generateStructured(prompt.trim(), schema as Schema, {
            systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
        })

        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = message.includes('GEMINI_API_KEY') ? 503 : message.includes('JSON') ? 422 : 500
        return NextResponse.json({error: message}, {status})
    }
}
