import {NextRequest, NextResponse} from 'next/server'
import {analyzeImage, type Schema} from '@/lib/ai/client'
import {SYSTEM_INSTRUCTION} from '@/app/api/ai/config'
import {authenticateRequest} from '@/lib/api/auth'

const MAX_BASE64_LENGTH = 6 * 1024 * 1024 // ~4.5MB payload limit (Vercel Serverless Function limit)
const ALLOWED_MIME_PREFIX = 'image/'

/**
 * POST /api/ai/vision
 * Multimodal image understanding & OCR endpoint using Gemini Vision. Requires authentication.
 *
 * Body: { image: string, mimeType?: string, prompt: string, schema?: Schema, systemInstruction?: string }
 * Response: { data: string | T } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const body = await request.json()
        const {image, mimeType, prompt, schema, systemInstruction} = body

        if (!image || typeof image !== 'string' || image.trim().length === 0) {
            return NextResponse.json(
                {error: 'Image data (base64 or data URL) is required and must not be empty'},
                {status: 400}
            )
        }

        if (image.length > MAX_BASE64_LENGTH) {
            return NextResponse.json(
                {error: 'Image payload exceeds maximum serverless limit (4MB). Please upload a smaller or optimized image.'},
                {status: 413}
            )
        }

        if (mimeType && typeof mimeType === 'string' && !mimeType.startsWith(ALLOWED_MIME_PREFIX)) {
            return NextResponse.json(
                {error: 'Invalid MIME type. Must be an image format (e.g. image/jpeg, image/png, image/webp)'},
                {status: 400}
            )
        }

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                {error: 'Prompt is required and must be a non-empty string'},
                {status: 400}
            )
        }

        const data = await analyzeImage(
            image,
            prompt.trim(),
            {
                mimeType,
                schema: schema as Schema | undefined,
                systemInstruction: systemInstruction || SYSTEM_INSTRUCTION,
            }
        )

        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = message.includes('GEMINI_API_KEY') ? 503 : message.includes('JSON') ? 422 : 500
        return NextResponse.json({error: message}, {status})
    }
}
