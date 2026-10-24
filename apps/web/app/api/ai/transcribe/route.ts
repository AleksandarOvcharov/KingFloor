import {NextRequest, NextResponse} from 'next/server'
import {transcribeAudio} from '@/lib/ai/client'
import {authenticateRequest} from '@/lib/api/auth'

const MAX_AUDIO_PAYLOAD = 6 * 1024 * 1024 // ~4.5MB Serverless Limit

/**
 * POST /api/ai/transcribe
 * Universal audio transcription endpoint powered by Gemini Multimodal Audio. Requires authentication.
 * Works seamlessly across 100% of browsers (including Firefox, Safari, Chrome, Edge, Opera, iOS, Android).
 *
 * Body: { audio: string, mimeType?: string, lang?: string }
 * Response: { text: string } or { error: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const body = await request.json()
        const {audio, mimeType, lang} = body

        if (!audio || typeof audio !== 'string' || audio.trim().length === 0) {
            return NextResponse.json(
                {error: 'Audio data (base64 or data URL) is required and must not be empty'},
                {status: 400}
            )
        }

        // Fast return for empty recordings (< 500 characters of base64 data)
        const base64Content = audio.includes(',') ? audio.split(',')[1] : audio
        if (!base64Content || base64Content.trim().length < 200) {
            return NextResponse.json({text: ''}, {status: 200})
        }

        if (audio.length > MAX_AUDIO_PAYLOAD) {
            return NextResponse.json(
                {error: 'Audio payload exceeds maximum limit (4.5MB)'},
                {status: 413}
            )
        }

        const languagePrompt = lang
            ? `Transcribe this audio recording spoken in language code "${lang}".`
            : undefined

        const text = await transcribeAudio(audio, {
            mimeType,
            languagePrompt,
        })

        return NextResponse.json({text: text || ''}, {status: 200})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const status = message.includes('GEMINI_API_KEY') ? 503 : 500
        return NextResponse.json({error: message}, {status})
    }
}
