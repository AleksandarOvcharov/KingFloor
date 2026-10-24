'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {useI18n} from '@/lib/i18n/provider'
import {supabase} from '@/lib/supabase/client'

export interface UseSpeechToTextOptions {
    /** Language code (BCP 47 tag), e.g. 'en-US', 'bg-BG', 'es-ES', 'de-DE'. Default: auto-detect from navigator.language or 'en-US' */
    lang?: string
    /** Whether to continuously listen without stopping after pauses. Default: true */
    continuous?: boolean
    /** Whether to emit interim (in-progress) partial transcripts. Default: true */
    interimResults?: boolean
    /** Callback fired when new speech is transcribed in real-time. `sessionTranscript` is the complete transcript of the current active session. */
    onTranscript?: (sessionTranscript: string, isFinal: boolean) => void
    /** Callback fired when an error occurs */
    onError?: (error: string) => void
    /** Preferred engine mode: 'auto' (Web Speech if available, MediaRecorder fallback), 'web-speech', or 'gemini' */
    mode?: 'auto' | 'web-speech' | 'gemini'
}

export interface UseSpeechToTextReturn {
    /** Whether speech recognition / microphone recording is actively listening */
    isListening: boolean
    /** Whether audio is currently being transcribed via backend AI */
    isTranscribing: boolean
    /** Whether speech recognition or audio recording is supported in the current browser & context */
    isSupported: boolean
    /** Final accumulated speech text of the active session */
    transcript: string
    /** Live interim in-progress speech text */
    interimTranscript: string
    /** Active engine being used ('web-speech' | 'media-recorder' | null) */
    engine: 'web-speech' | 'media-recorder' | null
    /** Start listening / recording */
    startListening: (options?: { lang?: string }) => Promise<void>
    /** Stop listening / recording */
    stopListening: () => void
    /** Toggle between listening and idle */
    toggleListening: (options?: { lang?: string }) => void
    /** Clear current transcript text */
    resetTranscript: () => void
    /** Last error message, or null */
    error: string | null
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionResult {
    isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
    length: number
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult
    length: number
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onstart: ((this: ISpeechRecognition, ev: Event) => void) | null
    onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onerror: ((this: ISpeechRecognition, ev: Event & { error?: string }) => void) | null
    onend: ((this: ISpeechRecognition, ev: Event) => void) | null
}

declare global {
    interface Window {
        SpeechRecognition?: {
            new (): ISpeechRecognition
        }
        webkitSpeechRecognition?: {
            new (): ISpeechRecognition
        }
    }
}

/**
 * Universal Real-Time Speech-to-Text Hook supporting 100% of browsers.
 * - In Chrome / Edge / Safari: Uses instant browser-native Web Speech API with sub-second real-time typing.
 * - In Firefox and other browsers: Automatically uses MediaRecorder + Gemini Multimodal Audio transcription.
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
    const {t} = useI18n()
    const {
        lang,
        continuous = true,
        interimResults = true,
        mode = 'auto',
        onTranscript,
        onError,
    } = options

    const getInitialLang = () => {
        if (lang) return lang
        if (typeof navigator !== 'undefined' && navigator.language) {
            return navigator.language
        }
        return 'en-US'
    }

    const [isListening, setIsListening] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [engine, setEngine] = useState<'web-speech' | 'media-recorder' | null>(null)

    const recognitionRef = useRef<ISpeechRecognition | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioStreamRef = useRef<MediaStream | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const isManuallyStoppedRef = useRef(false)
    const onTranscriptRef = useRef(onTranscript)
    const onErrorRef = useRef(onError)
    const currentLangRef = useRef(getInitialLang())

    useEffect(() => {
        onTranscriptRef.current = onTranscript
        onErrorRef.current = onError
        if (lang) {
            currentLangRef.current = lang
        }
    }, [onTranscript, onError, lang])

    // Browser support & secure context detection
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSecureContext =
                window.isSecureContext ||
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'

            const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
            const hasMediaDevices =
                typeof navigator !== 'undefined' &&
                'mediaDevices' in navigator &&
                'getUserMedia' in navigator.mediaDevices &&
                typeof MediaRecorder !== 'undefined'

            setIsSupported(isSecureContext && (hasWebSpeech || hasMediaDevices))
        }
    }, [])

    const stopMediaRecorderTracks = useCallback(() => {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop()
                } catch {
                    // Ignore track stop errors
                }
            })
            audioStreamRef.current = null
        }
    }, [])

    const stopMediaRecorder = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop()
            } catch {
                // Ignore stop errors
            }
        }
        stopMediaRecorderTracks()
    }, [stopMediaRecorderTracks])

    const stopListening = useCallback(() => {
        isManuallyStoppedRef.current = true
        setIsListening(false)

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch {
                // Ignore stop errors
            }
        }

        stopMediaRecorder()
    }, [stopMediaRecorder])

    const startListeningWithMediaRecorder = useCallback(
        async (targetLang: string) => {
            if (
                typeof window === 'undefined' ||
                !('mediaDevices' in navigator) ||
                !('getUserMedia' in navigator.mediaDevices) ||
                typeof MediaRecorder === 'undefined'
            ) {
                const err = t.speech.notSupportedHttps
                setIsListening(false)
                setError(err)
                onErrorRef.current?.(err)
                return
            }

            try {
                setError(null)
                setTranscript('')
                setInterimTranscript('')
                audioChunksRef.current = []

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                audioStreamRef.current = stream

                let mimeType = 'audio/webm'
                if (!MediaRecorder.isTypeSupported('audio/webm')) {
                    if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                        mimeType = 'audio/ogg;codecs=opus'
                    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                        mimeType = 'audio/mp4'
                    }
                }

                const recorder = new MediaRecorder(stream, { mimeType })
                mediaRecorderRef.current = recorder

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) {
                        audioChunksRef.current.push(e.data)
                    }
                }

                recorder.onstop = async () => {
                    stopMediaRecorderTracks()

                    if (audioChunksRef.current.length === 0) {
                        setIsListening(false)
                        return
                    }

                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
                    audioChunksRef.current = []

                    // Ignore ultra-short recordings under 500 bytes
                    if (audioBlob.size < 500) {
                        setIsListening(false)
                        return
                    }

                    setIsTranscribing(true)
                    try {
                        const reader = new FileReader()
                        reader.readAsDataURL(audioBlob)
                        reader.onloadend = async () => {
                            const dataUrl = reader.result as string
                            try {
                                const {data: {session}} = await supabase.auth.getSession()
                                if (!session?.access_token) {
                                    setError(t.speech.transcribeFailed)
                                    onErrorRef.current?.(t.speech.transcribeFailed)
                                    return
                                }

                                const res = await fetch('/api/ai/transcribe', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`,
                                    },
                                    body: JSON.stringify({
                                        audio: dataUrl,
                                        mimeType,
                                        lang: targetLang,
                                    }),
                                })

                                const json = await res.json()
                                if (!res.ok || json.error) {
                                    const errMsg = json.error || t.speech.transcribeFailed
                                    setError(errMsg)
                                    onErrorRef.current?.(errMsg)
                                    return
                                }

                                const text = (json.text || '').trim()
                                if (text) {
                                    setTranscript(text)
                                    onTranscriptRef.current?.(text, true)
                                }
                            } catch (e) {
                                const errMsg = e instanceof Error ? e.message : t.speech.transcriptionFailed
                                setError(errMsg)
                                onErrorRef.current?.(errMsg)
                            } finally {
                                setIsTranscribing(false)
                            }
                        }
                    } catch (e) {
                        setIsTranscribing(false)
                        const errMsg = e instanceof Error ? e.message : t.speech.processAudioFailed
                        setError(errMsg)
                        onErrorRef.current?.(errMsg)
                    }
                }

                recorder.start(250)
                setEngine('media-recorder')
                setIsListening(true)
                isManuallyStoppedRef.current = false
            } catch (err: unknown) {
                setIsListening(false)
                setIsTranscribing(false)
                stopMediaRecorderTracks()

                let message = t.speech.micPermissionDenied
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        message = t.speech.micAccessDenied
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        message = t.speech.noMicFound
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                        message = t.speech.micInUse
                    } else if (err.name === 'SecurityError') {
                        message = t.speech.micRequiresHttps
                    }
                }
                setError(message)
                onErrorRef.current?.(message)
            }
        },
        [stopMediaRecorderTracks, t]
    )

    const startListening = useCallback(
        async (startOptions?: { lang?: string }) => {
            const targetLang = startOptions?.lang || currentLangRef.current || 'en-US'
            setError(null)
            setTranscript('')
            setInterimTranscript('')

            const hasWebSpeech =
                typeof window !== 'undefined' &&
                !!(window.SpeechRecognition || window.webkitSpeechRecognition)

            // Fallback to MediaRecorder + Gemini if Web Speech is unsupported or mode is 'gemini'
            if (!hasWebSpeech || mode === 'gemini') {
                await startListeningWithMediaRecorder(targetLang)
                return
            }

            try {
                const SpeechRecognitionClass =
                    window.SpeechRecognition || window.webkitSpeechRecognition
                if (!SpeechRecognitionClass) {
                    await startListeningWithMediaRecorder(targetLang)
                    return
                }

                const recognition = new SpeechRecognitionClass()
                recognitionRef.current = recognition

                recognition.continuous = continuous
                recognition.interimResults = interimResults
                recognition.lang = targetLang
                recognition.maxAlternatives = 1

                let fullTranscript = ''

                recognition.onstart = () => {
                    setEngine('web-speech')
                    setIsListening(true)
                    isManuallyStoppedRef.current = false
                }

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let currentInterim = ''
                    let fullFinal = ''

                    for (let i = 0; i < event.results.length; i++) {
                        const res = event.results[i]
                        const text = res[0]?.transcript || ''
                        if (res.isFinal) {
                            fullFinal = fullFinal ? `${fullFinal} ${text}` : text
                        } else {
                            currentInterim = currentInterim ? `${currentInterim} ${text}` : text
                        }
                    }

                    const liveSessionText = (fullFinal + ' ' + currentInterim).trim()

                    if (fullFinal) {
                        fullTranscript = fullFinal
                        setTranscript(fullFinal)
                    }
                    setInterimTranscript(currentInterim)

                    if (liveSessionText) {
                        onTranscriptRef.current?.(liveSessionText, false)
                    }
                }

                recognition.onerror = (event: Event & { error?: string }) => {
                    if (event.error === 'no-speech' || event.error === 'aborted') {
                        return
                    }

                    isManuallyStoppedRef.current = true
                    setIsListening(false)

                    let message = event.error || t.speech.speechRecognitionError
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        message = t.speech.micAccessDenied
                    } else if (event.error === 'audio-capture') {
                        message = t.speech.noMicFoundOrNotWorking
                    } else if (event.error === 'network') {
                        message = t.speech.networkErrorSpeech
                    }

                    setError(message)
                    onErrorRef.current?.(message)
                }

                recognition.onend = () => {
                    if (fullTranscript) {
                        onTranscriptRef.current?.(fullTranscript, true)
                    }
                    // Auto-restart if continuous mode and not manually stopped
                    if (continuous && !isManuallyStoppedRef.current && recognitionRef.current === recognition) {
                        try {
                            recognition.start()
                            return
                        } catch {
                            // Recognition might already be starting
                        }
                    }
                    setIsListening(false)
                }

                recognition.start()
            } catch {
                // Fallback to MediaRecorder on recognition startup failure
                await startListeningWithMediaRecorder(targetLang)
            }
        },
        [continuous, interimResults, mode, startListeningWithMediaRecorder, t]
    )

    const toggleListening = useCallback(
        (toggleOptions?: { lang?: string }) => {
            if (isListening) {
                stopListening()
            } else {
                startListening(toggleOptions)
            }
        },
        [isListening, startListening, stopListening]
    )

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
        setError(null)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isManuallyStoppedRef.current = true
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort()
                } catch {
                    // Ignore abort errors
                }
                recognitionRef.current = null
            }
            stopMediaRecorder()
        }
    }, [stopMediaRecorder])

    return {
        isListening,
        isTranscribing,
        isSupported,
        transcript,
        interimTranscript,
        engine,
        startListening,
        stopListening,
        toggleListening,
        resetTranscript,
        error,
    }
}
