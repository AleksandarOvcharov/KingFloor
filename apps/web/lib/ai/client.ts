import {GoogleGenAI, Type, type Schema} from '@google/genai'
import type {ChatMessage} from '@workspace/shared'

export type {ChatMessage}

// ============================================================================
// Gemini AI Client & Multimodal Vision/Audio Helpers
// ============================================================================
// Thin wrapper around the Google Gemini API supporting:
//   1. One-shot & streaming text generation
//   2. Strictly-typed structured JSON outputs (JSON Schema)
//   3. Multimodal Image Analysis / OCR (Vision) with text or JSON schemas
//   4. Universal Audio Transcription (Speech-to-Text) for 100% browser support
//   5. Multi-turn chat persistence with multimodal attachments
//
// See docs/ai-setup.md for full documentation.
// ============================================================================

export { Type }
export type { Schema }

export const DEFAULT_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gemini-3.6-flash'

export const DEFAULT_SYSTEM_INSTRUCTION =
    'You are a helpful assistant. Answer questions clearly and concisely.'

export interface AIConfig {
    model?: string
    systemInstruction?: string
    temperature?: number
    maxOutputTokens?: number
}

export interface AnalyzeImageOptions extends AIConfig {
    schema?: Schema
    mimeType?: string
}

export interface ImageOptimizationOptions {
    maxDimension?: number
    quality?: number
}

export interface TranscribeAudioOptions extends AIConfig {
    mimeType?: string
    languagePrompt?: string
}

/**
 * Creates a GoogleGenAI client instance.
 * Uses the GEMINI_API_KEY environment variable.
 */
export function createAIClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
        throw new Error(
            'GEMINI_API_KEY is not configured. Please get a free API key at https://aistudio.google.com/apikey and add it to your .env.local file.'
        )
    }
    return new GoogleGenAI({apiKey: apiKey.trim()})
}

/**
 * Clean and parse JSON returned from an AI model.
 * Strips markdown code fences (```json ... ```), trims leading/trailing garbage,
 * and falls back to bracket extraction if needed.
 */
export function cleanAndParseJson<T = unknown>(rawText: string): T {
    const trimmed = (rawText || '').trim()
    if (!trimmed) {
        throw new Error('Model returned an empty response for structured JSON output.')
    }

    try {
        return JSON.parse(trimmed) as T
    } catch {
        // Strip markdown backticks
        const cleaned = trimmed
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/i, '')
            .trim()

        try {
            return JSON.parse(cleaned) as T
        } catch {
            // Extract the outermost JSON object or array
            const firstBrace = cleaned.indexOf('{')
            const firstBracket = cleaned.indexOf('[')
            let startIdx = -1
            if (firstBrace !== -1 && firstBracket !== -1) {
                startIdx = Math.min(firstBrace, firstBracket)
            } else if (firstBrace !== -1) {
                startIdx = firstBrace
            } else if (firstBracket !== -1) {
                startIdx = firstBracket
            }

            const lastBrace = cleaned.lastIndexOf('}')
            const lastBracket = cleaned.lastIndexOf(']')
            const endIdx = Math.max(lastBrace, lastBracket)

            if (startIdx !== -1 && endIdx > startIdx) {
                const extracted = cleaned.substring(startIdx, endIdx + 1)
                return JSON.parse(extracted) as T
            }

            throw new Error('Invalid JSON response returned from model.')
        }
    }
}

/**
 * Convert a File or Blob object into a base64 string and MIME type.
 * Automatically optimizes large images in browser environments to avoid payload limit issues.
 * Works in browser, Node.js, and Edge runtimes.
 */
export async function fileToBase64(
    file: File | Blob,
    options: ImageOptimizationOptions = {}
): Promise<{ base64: string; mimeType: string }> {
    const { maxDimension = 1920, quality = 0.85 } = options
    const mimeType = file.type || 'image/jpeg'

    // Browser environment with canvas support for auto-resizing
    if (typeof window !== 'undefined' && typeof Image !== 'undefined' && mimeType.startsWith('image/')) {
        try {
            return await new Promise((resolve, reject) => {
                const img = new Image()
                const objectUrl = URL.createObjectURL(file)
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl)
                    let { width, height } = img

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width)
                            width = maxDimension
                        } else {
                            width = Math.round((width * maxDimension) / height)
                            height = maxDimension
                        }
                    }

                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        fallbackFileReader(file, mimeType).then(resolve).catch(reject)
                        return
                    }

                    ctx.drawImage(img, 0, 0, width, height)
                    const targetMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg'
                    const dataUrl = canvas.toDataURL(targetMime, quality)
                    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
                    if (match) {
                        resolve({ mimeType: match[1], base64: match[2] })
                    } else {
                        fallbackFileReader(file, mimeType).then(resolve).catch(reject)
                    }
                }
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl)
                    fallbackFileReader(file, mimeType).then(resolve).catch(reject)
                }
                img.src = objectUrl
            })
        } catch {
            return fallbackFileReader(file, mimeType)
        }
    }

    if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
        return fallbackFileReader(file, mimeType)
    }

    // Node.js runtime fallback
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return { base64, mimeType }
}

function fallbackFileReader(file: File | Blob, mimeType: string): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            const base64 = result.includes(',') ? result.split(',')[1] : result
            resolve({ base64, mimeType })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

/**
 * Parse an image input (Data URL, raw Base64, or object) into normalized base64 and mimeType.
 */
export function parseImageInput(
    image: string | { base64: string; mimeType?: string },
    defaultMimeType = 'image/jpeg'
): { base64: string; mimeType: string } {
    if (typeof image === 'object' && image !== null && 'base64' in image) {
        const raw = image.base64
        if (raw.startsWith('data:')) {
            const match = raw.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
                return { mimeType: match[1], base64: match[2] }
            }
        }
        return { base64: raw, mimeType: image.mimeType || defaultMimeType }
    }

    if (typeof image === 'string') {
        if (image.startsWith('data:')) {
            const match = image.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
                return { mimeType: match[1], base64: match[2] }
            }
        }
        return { base64: image, mimeType: defaultMimeType }
    }

    throw new Error('Invalid image input format. Expected base64 string or data URL.')
}

/**
 * Parse an audio input (Data URL, raw Base64, or object) into normalized base64 and mimeType.
 */
export function parseAudioInput(
    audio: string | { base64: string; mimeType?: string },
    defaultMimeType = 'audio/webm'
): { base64: string; mimeType: string } {
    if (typeof audio === 'object' && audio !== null && 'base64' in audio) {
        const raw = audio.base64
        if (raw.startsWith('data:')) {
            const match = raw.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
                return { mimeType: match[1], base64: match[2] }
            }
        }
        return { base64: raw, mimeType: audio.mimeType || defaultMimeType }
    }

    if (typeof audio === 'string') {
        if (audio.startsWith('data:')) {
            const match = audio.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
                return { mimeType: match[1], base64: match[2] }
            }
        }
        return { base64: audio, mimeType: defaultMimeType }
    }

    throw new Error('Invalid audio input format. Expected base64 string or data URL.')
}

/**
 * Generate a single text response from a prompt.
 */
export async function generateText(
    prompt: string,
    config: AIConfig = {}
): Promise<string> {
    const ai = createAIClient()
    const response = await ai.models.generateContent({
        model: config.model || DEFAULT_MODEL,
        contents: prompt,
        config: {
            systemInstruction: config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        },
    })
    return response.text || ''
}

/**
 * Generate a structured response conforming to a strict JSON schema.
 * Guaranteed to return type-safe JSON matching the specified schema,
 * eliminating JSON markdown code block fences and hallucinated formats.
 */
export async function generateStructured<T = unknown>(
    prompt: string,
    schema: Schema,
    config: AIConfig = {}
): Promise<T> {
    const ai = createAIClient()
    const response = await ai.models.generateContent({
        model: config.model || DEFAULT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            systemInstruction: config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        },
    })

    const rawText = response.text || ''
    return cleanAndParseJson<T>(rawText)
}

/**
 * Multimodal Image Analysis / OCR.
 * Accepts a File, Blob, base64 string, or data URL and analyzes it with Gemini Vision.
 * If a schema is provided, returns strictly typed structured JSON.
 * Otherwise returns a text response.
 */
export async function analyzeImage<T = string>(
    image: string | { base64: string; mimeType?: string },
    prompt: string,
    options: AnalyzeImageOptions = {}
): Promise<T> {
    const ai = createAIClient()
    const {base64, mimeType} = parseImageInput(image)

    const isStructured = !!options.schema

    const response = await ai.models.generateContent({
        model: options.model || DEFAULT_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64,
                        },
                    },
                    {text: prompt},
                ],
            },
        ],
        config: {
            systemInstruction: options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            temperature: options.temperature,
            maxOutputTokens: options.maxOutputTokens,
            ...(isStructured && {
                responseMimeType: 'application/json',
                responseSchema: options.schema,
            }),
        },
    })

    const rawText = response.text || ''

    if (isStructured) {
        return cleanAndParseJson<T>(rawText)
    }

    return rawText as unknown as T
}

/**
 * Universal Gemini Audio Transcription.
 * Accepts recorded audio (base64 string or data URL) and transcribes spoken speech into text.
 */
export async function transcribeAudio(
    audio: string | { base64: string; mimeType?: string },
    options: TranscribeAudioOptions = {}
): Promise<string> {
    const ai = createAIClient()
    const {base64, mimeType} = parseAudioInput(audio, options.mimeType || 'audio/webm')

    const promptText =
        options.languagePrompt ||
        'Transcribe the spoken speech in this audio accurately into text without adding commentary or preamble.'

    const response = await ai.models.generateContent({
        model: options.model || DEFAULT_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64,
                        },
                    },
                    {text: promptText},
                ],
            },
        ],
        config: {
            temperature: options.temperature ?? 0.1,
            maxOutputTokens: options.maxOutputTokens,
        },
    })

    return (response.text || '').trim()
}

/**
 * Generate a chat response within an existing conversation history.
 * Supports text and multimodal image inputs in the conversation turns.
 */
export async function generateChatResponse(
    messages: ChatMessage[],
    newMessage: string,
    config: AIConfig = {},
    attachment?: { base64: string; mimeType: string }
): Promise<string> {
    const ai = createAIClient()

    // Map existing history into GoogleGenAI contents format
    const contents = messages.map((msg) => ({
        role: msg.role,
        parts: msg.parts.map((p) => ({text: p.text})),
    }))

    // Construct the new user message turn
    const newTurnParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    if (attachment) {
        newTurnParts.push({
            inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.base64,
            },
        })
    }

    newTurnParts.push({text: newMessage})

    contents.push({
        role: 'user',
        parts: newTurnParts as { text: string }[],
    })

    const response = await ai.models.generateContent({
        model: config.model || DEFAULT_MODEL,
        contents,
        config: {
            systemInstruction: config.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        },
    })

    return response.text || ''
}
