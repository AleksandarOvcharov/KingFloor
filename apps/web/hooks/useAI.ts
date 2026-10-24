'use client'

import {useState, useCallback, useRef, useEffect, type Dispatch, type SetStateAction} from 'react'
import {fileToBase64} from '@/lib/ai/client'
import {getAuthHeaders} from '@/lib/api/client'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import type {Schema} from '@google/genai'
import type {ChatMessage} from '@workspace/shared'

export type {ChatMessage}

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB client check
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DEFAULT_TIMEOUT_MS = 30000 // 30s timeout guard

export interface UseAIReturn {
    /** Generate free-form text from a prompt */
    generateText: (prompt: string, signal?: AbortSignal) => Promise<string>
    /** Generate typed structured data matching a Gemini Schema */
    generateStructured: <T = unknown>(prompt: string, schema: Schema, signal?: AbortSignal) => Promise<T>
    /** Analyze an image (File, Blob, base64, or data URL) with text prompt and optional schema */
    analyzeImage: <T = string>(
        image: File | Blob | string,
        prompt: string,
        schema?: Schema,
        signal?: AbortSignal
    ) => Promise<T>
    /** Send a chat message (maintains conversation history internally) */
    sendMessage: (message: string, options?: { imageUrl?: string; signal?: AbortSignal }) => Promise<string>
    /** Stop any currently running AI generation request */
    stop: () => void
    /** The full chat history */
    messages: ChatMessage[]
    /** Replace chat messages (e.g. when loading a conversation or updating state) */
    setMessages: Dispatch<SetStateAction<ChatMessage[]>>
    /** Clear chat history to start a new conversation */
    clearChat: () => void
    /** Whether a request is in progress */
    loading: boolean
    /** Last error message, or null */
    error: string | null
}

/**
 * React hook for AI features.
 * Provides text generation, structured JSON schemas, multimodal vision / OCR, and multi-turn chat.
 *
 * Usage:
 *   const { sendMessage, generateStructured, analyzeImage, stop, loading } = useAI()
 *   const reply = await sendMessage("Hello!")
 *   const pins = await generateStructured<MapPin[]>("Recommend 3 cafes", pinSchema)
 *   const ocr = await analyzeImage(file, "Extract receipt total and items", receiptSchema)
 */
export function useAI(): UseAIReturn {
    const {t} = useI18n()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesRef = useRef(messages)
    messagesRef.current = messages

    // AbortController ref to cancel in-flight requests
    const activeAbortControllerRef = useRef<AbortController | null>(null)

    const stop = useCallback(() => {
        if (activeAbortControllerRef.current) {
            activeAbortControllerRef.current.abort()
            activeAbortControllerRef.current = null
            setLoading(false)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (activeAbortControllerRef.current) {
                activeAbortControllerRef.current.abort()
            }
        }
    }, [])

    const createAbortSignal = (customSignal?: AbortSignal): { controller: AbortController; signal: AbortSignal } => {
        if (activeAbortControllerRef.current) {
            activeAbortControllerRef.current.abort()
        }
        const controller = new AbortController()
        activeAbortControllerRef.current = controller

        // Forward custom external abort signal if provided
        if (customSignal) {
            if (customSignal.aborted) {
                controller.abort()
            } else {
                customSignal.addEventListener('abort', () => controller.abort(), {once: true})
            }
        }

        return {controller, signal: controller.signal}
    }

    const generateText = useCallback(async (prompt: string, signal?: AbortSignal): Promise<string> => {
        setLoading(true)
        setError(null)

        const {controller, signal: combinedSignal} = createAbortSignal(signal)
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

        let errorMsg: string | null = null
        let responseData: { ok: boolean; data?: string; error?: string } | null = null

        try {
            const authHeaders = await getAuthHeaders()
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...authHeaders},
                body: JSON.stringify({prompt}),
                signal: combinedSignal,
            })
            const json = await response.json()
            responseData = {
                ok: response.ok,
                data: json.text,
                error: json.error,
            }
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') {
                errorMsg = t.ai.requestCancelled
            } else {
                errorMsg = err instanceof Error ? err.message : t.ai.unknownError
            }
        } finally {
            clearTimeout(timeoutId)
            activeAbortControllerRef.current = null
            setLoading(false)
        }

        if (errorMsg) {
            setError(errorMsg)
            throw new Error(errorMsg)
        }

        if (!responseData || !responseData.ok) {
            const msg = responseData?.error || t.ai.failedGenerateText
            setError(msg)
            throw new Error(msg)
        }

        return responseData.data ?? ''
    }, [t])

    const generateStructured = useCallback(
        async <T = unknown>(prompt: string, schema: Schema, signal?: AbortSignal): Promise<T> => {
            setLoading(true)
            setError(null)

            const {controller, signal: combinedSignal} = createAbortSignal(signal)
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

            let errorMsg: string | null = null
            let responseData: { ok: boolean; data?: T; error?: string } | null = null

            try {
                const authHeaders = await getAuthHeaders()
                const response = await fetch('/api/ai/structured', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', ...authHeaders},
                    body: JSON.stringify({prompt, schema}),
                    signal: combinedSignal,
                })
                const json = await response.json()
                responseData = {
                    ok: response.ok,
                    data: json.data,
                    error: json.error,
                }
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') {
                    errorMsg = t.ai.requestCancelled
                } else {
                    errorMsg = err instanceof Error ? err.message : t.ai.unknownError
                }
            } finally {
                clearTimeout(timeoutId)
                activeAbortControllerRef.current = null
                setLoading(false)
            }

            if (errorMsg) {
                setError(errorMsg)
                throw new Error(errorMsg)
            }

            if (!responseData || !responseData.ok) {
                const msg = responseData?.error || t.ai.failedGenerateStructured
                setError(msg)
                throw new Error(msg)
            }

            return responseData.data as T
        },
        [t]
    )

    const analyzeImage = useCallback(
        async <T = string>(
            image: File | Blob | string,
            prompt: string,
            schema?: Schema,
            signal?: AbortSignal
        ): Promise<T> => {
            setLoading(true)
            setError(null)

            // Client-side file validations
            if (typeof File !== 'undefined' && image instanceof File) {
                if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
                    const msg = tFormat(t.ai.unsupportedImageFormat, {type: image.type})
                    setError(msg)
                    setLoading(false)
                    throw new Error(msg)
                }
            }

            const {controller, signal: combinedSignal} = createAbortSignal(signal)
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

            let errorMsg: string | null = null
            let responseData: { ok: boolean; data?: T; error?: string } | null = null

            try {
                let imagePayload: string
                let mimeType: string | undefined

                if (typeof image === 'string') {
                    imagePayload = image
                } else {
                    // fileToBase64 auto-downscales large images via canvas if needed
                    const converted = await fileToBase64(image, { maxDimension: 1920, quality: 0.85 })
                    imagePayload = converted.base64
                    mimeType = converted.mimeType
                }

                const authHeaders = await getAuthHeaders()
                const response = await fetch('/api/ai/vision', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', ...authHeaders},
                    body: JSON.stringify({image: imagePayload, mimeType, prompt, schema}),
                    signal: combinedSignal,
                })
                const json = await response.json()
                responseData = {
                    ok: response.ok,
                    data: json.data,
                    error: json.error,
                }
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') {
                    errorMsg = t.ai.requestCancelled
                } else {
                    errorMsg = err instanceof Error ? err.message : t.ai.unknownError
                }
            } finally {
                clearTimeout(timeoutId)
                activeAbortControllerRef.current = null
                setLoading(false)
            }

            if (errorMsg) {
                setError(errorMsg)
                throw new Error(errorMsg)
            }

            if (!responseData || !responseData.ok) {
                const msg = responseData?.error || t.ai.failedAnalyzeImage
                setError(msg)
                throw new Error(msg)
            }

            return responseData.data as T
        },
        [t]
    )

    const sendMessage = useCallback(
        async (message: string, options?: { imageUrl?: string; signal?: AbortSignal }): Promise<string> => {
            setLoading(true)
            setError(null)

            // Show user message once immediately in state
            const userMsg: ChatMessage = {
                role: 'user',
                parts: [{text: message}],
                imageUrl: options?.imageUrl,
            }
            setMessages((prev) => [...prev, userMsg])

            const {controller, signal: combinedSignal} = createAbortSignal(options?.signal)
            const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

            let errorMsg: string | null = null
            let responseData: { ok: boolean; data?: string; error?: string } | null = null

            try {
                const authHeaders = await getAuthHeaders()
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', ...authHeaders},
                    body: JSON.stringify({messages: messagesRef.current, message}),
                    signal: combinedSignal,
                })
                const json = await response.json()
                responseData = {
                    ok: response.ok,
                    data: json.data,
                    error: json.error,
                }
            } catch (err) {
                if ((err as Error)?.name === 'AbortError') {
                    errorMsg = t.ai.requestCancelled
                } else {
                    errorMsg = err instanceof Error ? err.message : t.ai.unknownError
                }
            } finally {
                clearTimeout(timeoutId)
                activeAbortControllerRef.current = null
                setLoading(false)
            }

            if (errorMsg) {
                setError(errorMsg)
                // Remove the user message on error so they can retry
                setMessages((prev) => prev.slice(0, -1))
                throw new Error(errorMsg)
            }

            if (!responseData || !responseData.ok) {
                const msg = responseData?.error || t.ai.failedSendMessage
                setError(msg)
                // Remove the user message on error so they can retry
                setMessages((prev) => prev.slice(0, -1))
                throw new Error(msg)
            }

            const replyText = responseData.data ?? ''
            const modelMsg: ChatMessage = {role: 'model', parts: [{text: replyText}]}
            setMessages((prev) => [...prev, modelMsg])

            return replyText
        },
        [t]
    )

    const clearChat = useCallback(() => {
        stop()
        setMessages([])
        setError(null)
    }, [stop])

    return {
        generateText,
        generateStructured,
        analyzeImage,
        sendMessage,
        stop,
        messages,
        setMessages,
        clearChat,
        loading,
        error,
    }
}
