'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import Link from 'next/link'
import {suggestions} from '@/lib/ai/suggestions'
import {fileToBase64} from '@/lib/ai/client'
import {useAuth} from '@/hooks/useAuth'
import {useAI, type ChatMessage} from '@/hooks/useAI'
import {useChatHistory} from '@/hooks/useChatHistory'
import {useAnalytics} from '@/hooks/useAnalytics'
import {useSpeechToText} from '@/hooks/useSpeechToText'
import {Header} from '@/components/header'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent} from '@workspace/ui/ui/card'
import {MarkdownRenderer} from '@/components/markdown/markdown-renderer'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {
    Bot,
    ImageIcon,
    Loader2,
    MessageSquare,
    Mic,
    MicOff,
    PanelLeft,
    PanelLeftClose,
    Plus,
    Send,
    Trash2,
    UploadCloud,
    User,
    X,
} from 'lucide-react'

export default function AIChat() {
    const {user, loading: authLoading} = useAuth()
    const {analyzeImage, sendMessage, messages, setMessages, clearChat, loading, error} = useAI()
    const {
        conversations,
        activeConversationId,
        createConversation,
        selectConversation,
        deleteConversation,
        saveMessage,
        loading: historyLoading,
    } = useChatHistory(user)
    const {trackEvent} = useAnalytics(user)
    const {t, locale} = useI18n()

    const [mounted, setMounted] = useState(false)
    const [input, setInput] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([])
    const [speechLang, setSpeechLang] = useState<'bg-BG' | 'en-US'>('en-US')
    const [attachedImage, setAttachedImage] = useState<{
        base64: string
        mimeType: string
        previewUrl: string
        name: string
    } | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const baseInputRef = useRef('')
    const isSendingRef = useRef(false)

    const getRandomSuggestions = useCallback((count: number = 3) => {
        const shuffled = [...suggestions[locale]].sort(() => 0.5 - Math.random())
        return shuffled.slice(0, count)
    }, [locale])

    // Auto-detect Bulgarian browser language after mount
    useEffect(() => {
        setMounted(true)
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setSidebarOpen(true)
        }
        if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('bg')) {
            setSpeechLang('bg-BG')
        }
    }, [])

    // Real-Time Live Speech-to-Text
    const {
        isListening,
        isTranscribing,
        interimTranscript,
        toggleListening,
        stopListening,
        error: speechError,
    } = useSpeechToText({
        lang: speechLang,
        continuous: true,
        interimResults: true,
        onTranscript: (liveSessionText) => {
            const base = baseInputRef.current.trim()
            const live = liveSessionText.trim()
            if (!live) return
            setInput(base ? `${base} ${live}` : live)
        },
    })

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
        setCurrentSuggestions(getRandomSuggestions())
    }, [messages, loading, getRandomSuggestions])

    // Auto-resize textarea dynamically as text is spoken or typed
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
        }
    }, [input])

    // Auto-focus textarea when user starts typing anywhere on the page
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            if (e.ctrlKey || e.metaKey || e.altKey) return
            if (e.key.length !== 1) return

            if (inputRef.current) {
                inputRef.current.focus()
            }
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [])

    const handleNewChat = useCallback(async () => {
        if (messages.length === 0 && !attachedImage) return
        stopListening()
        clearChat()
        setAttachedImage(null)
        baseInputRef.current = ''
        setCurrentSuggestions(getRandomSuggestions())
        if (user) {
            await createConversation()
            trackEvent('chat_created')
        }
    }, [user, messages.length, attachedImage, clearChat, createConversation, trackEvent, stopListening, getRandomSuggestions])

    const handleSelectConversation = useCallback(async (id: string) => {
        if (id === activeConversationId) return
        stopListening()
        setAttachedImage(null)
        baseInputRef.current = ''
        const msgs = await selectConversation(id)
        setMessages(msgs)
    }, [activeConversationId, selectConversation, setMessages, stopListening])

    const handleDeleteConversation = useCallback(async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        await deleteConversation(id)
        trackEvent('chat_deleted')
        if (id === activeConversationId) {
            stopListening()
            clearChat()
            setAttachedImage(null)
            baseInputRef.current = ''
        }
    }, [activeConversationId, deleteConversation, clearChat, trackEvent, stopListening])

    const handleImageSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) return
        try {
            const {base64, mimeType} = await fileToBase64(file)
            setAttachedImage({
                base64,
                mimeType,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
            })
            inputRef.current?.focus()
        } catch {
            // Ignore error
        }
    }

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    e.preventDefault()
                    await handleImageSelect(file)
                    break
                }
            }
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer?.files?.[0]
        if (file && file.type.startsWith('image/')) {
            await handleImageSelect(file)
        }
    }

    const send = async (text: string) => {
        stopListening()
        const hasImage = !!attachedImage
        const promptText = text.trim()
        if ((!promptText && !hasImage) || loading || isSendingRef.current) return
        isSendingRef.current = true

        let convId = activeConversationId
        if (user && !convId) {
            convId = await createConversation()
            trackEvent('chat_created')
        }

        const currentImage = attachedImage
        const effectivePrompt = promptText || t.ai.analyzeImageDefault

        const imagePersistenceContent = currentImage
            ? `![${currentImage.name}](data:${currentImage.mimeType};base64,${currentImage.base64})\n\n${effectivePrompt}`
            : effectivePrompt

        setInput('')
        baseInputRef.current = ''
        setAttachedImage(null)

        if (user && convId) {
            await saveMessage('user', imagePersistenceContent, convId)
        }

        trackEvent('chat_message_sent', {
            is_new_conversation: !activeConversationId,
            conversation_id: convId,
            has_image: hasImage,
        })

        try {
            let responseText = ''
            if (currentImage) {
                const userMessage: ChatMessage = {
                    role: 'user',
                    parts: [{text: effectivePrompt}],
                    imageUrl: currentImage.previewUrl,
                }
                setMessages(prev => [...prev, userMessage])

                responseText = await analyzeImage(
                    `data:${currentImage.mimeType};base64,${currentImage.base64}`,
                    effectivePrompt
                )
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'model',
                        parts: [{text: responseText}],
                    },
                ])
            } else {
                responseText = await sendMessage(effectivePrompt)
            }

            if (user && convId) {
                await saveMessage('model', responseText, convId)
            }
        } catch {
            // Error is handled in useAI
        } finally {
            isSendingRef.current = false
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await send(input)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send(input)
        }
    }

    const isSubmitDisabled = !mounted ? true : Boolean(loading || (!input.trim() && !attachedImage))

    return (
        <main
            className="min-h-screen flex flex-col bg-background relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag & Drop Visual Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary pointer-events-none animate-in fade-in duration-200">
                    <UploadCloud className="h-16 w-16 text-primary animate-bounce mb-4" />
                    <p className="text-xl font-semibold text-foreground">{t.ai.dropImageHere}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t.ai.supportsFormats}</p>
                </div>
            )}

            <Header />

            {/* Mobile Sidebar Backdrop Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-72 bg-background md:bg-muted/30 border-r flex flex-col transition-all duration-200 ease-in-out md:relative md:z-auto shrink-0 shadow-xl md:shadow-none ${
                        sidebarOpen ? 'translate-x-0 md:w-72' : '-translate-x-full md:translate-x-0 md:w-0'
                    } overflow-hidden`}
                >
                    <div className="p-3 border-b flex items-center justify-between">
                        <span className="text-sm font-semibold">{t.ai.conversations}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(false)}
                            className="h-8 w-8 md:hidden text-muted-foreground hover:text-foreground"
                            aria-label={t.ai.closeSidebar}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNewChat}
                            title={t.ai.newChat}
                            className="h-8 w-8"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {historyLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : !user ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                <p>{t.ai.signInToSave}</p>
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
                                        {t.ai.signIn}
                                    </Button>
                                </Link>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                {t.ai.noConversationsYet}
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => {
                                        handleSelectConversation(conv.id)
                                        if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false)
                                    }}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                                        conv.id === activeConversationId
                                            ? 'bg-accent text-accent-foreground font-medium'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{conv.title}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                                        title={t.ai.deleteConversationTitle}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top bar with sidebar toggle */}
                    <div className="px-4 py-2 border-b flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title={sidebarOpen ? t.ai.closeSidebar : t.ai.openSidebar}
                        >
                            {sidebarOpen ? (
                                <PanelLeftClose className="h-4 w-4" />
                            ) : (
                                <PanelLeft className="h-4 w-4" />
                            )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {user ? t.ai.chatHistoryEnabled : t.ai.guestMode}
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl w-full mx-auto">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Bot className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">{t.ai.howCanIHelp}</h2>
                                <p className="text-muted-foreground text-sm max-w-md mb-8">
                                    {t.ai.askQuestionsHint}
                                </p>

                                <div className="grid sm:grid-cols-3 gap-3 w-full max-w-2xl">
                                    {currentSuggestions.map((suggestion, index) => (
                                        <Card
                                            key={index}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => {
                                                setInput(suggestion)
                                                inputRef.current?.focus()
                                            }}
                                        >
                                            <CardContent className="p-3">
                                                <p className="text-xs text-muted-foreground">{suggestion}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${
                                        message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {message.role === 'model' && (
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-lg px-3.5 sm:px-4 py-2 sm:py-2.5 max-w-[88%] sm:max-w-[80%] text-sm ${
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        {message.imageUrl && (
                                            <div className="mb-2 rounded overflow-hidden max-w-xs">
                                                <img
                                                    src={message.imageUrl}
                                                    alt={t.ai.attachedContext}
                                                    className="w-full h-auto max-h-48 object-cover rounded border border-primary-foreground/20"
                                                />
                                            </div>
                                        )}
                                        {message.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{message.parts[0].text}</p>
                                        ) : (
                                            <MarkdownRenderer content={message.parts[0].text} />
                                        )}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                                <div className="rounded-lg px-4 py-2.5 bg-muted">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error display */}
                    {(error || speechError) && (
                        <div className="max-w-3xl mx-auto mb-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                            {error || speechError}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
                        {/* Live voice recording / transcribing indicator banner */}
                        {(isListening || isTranscribing) && (
                            <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between p-2 px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs animate-slide-up text-red-600 dark:text-red-400">
                                <div className="flex items-center gap-2">
                                    {isTranscribing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                        </span>
                                    )}
                                    <span className="font-medium">
                                        {isTranscribing
                                            ? t.ai.transcribingWithGemini
                                            : `${tFormat(t.ai.listeningLabel, {lang: speechLang === 'bg-BG' ? 'BG' : 'EN'})} ${
                                                  interimTranscript ? `"${interimTranscript}"` : t.ai.speakIntoMic
                                              }`}
                                    </span>
                                </div>
                                {isListening && (
                                    <button
                                        type="button"
                                        onClick={stopListening}
                                        className="font-semibold underline hover:opacity-80"
                                    >
                                        {t.ai.stop}
                                    </button>
                                )}
                            </div>
                        )}

                        {attachedImage && (
                            <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 p-1.5 pr-3 bg-muted/80 backdrop-blur rounded-lg border text-xs w-fit animate-slide-up">
                                <img
                                    src={attachedImage.previewUrl}
                                    alt={t.ai.attachedPreviewAlt}
                                    className="h-10 w-10 object-cover rounded"
                                />
                                <span className="truncate max-w-[200px] font-medium">{attachedImage.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setAttachedImage(null)}
                                    className="p-1 hover:bg-background rounded-full transition-colors text-muted-foreground hover:text-foreground"
                                    title={t.ai.removeAttachedImage}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}
                              className="flex gap-1.5 sm:gap-2 items-end border rounded-xl p-1.5 sm:p-2 bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow max-w-3xl mx-auto shadow-xs">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleImageSelect(file)
                                    e.target.value = ''
                                }}
                            />

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                                onClick={() => fileInputRef.current?.click()}
                                title={t.ai.uploadImageTitle}
                                aria-label={t.ai.uploadImageAriaLabel}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>

                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                placeholder={
                                    !mounted
                                        ? t.ai.typeMessagePlaceholder
                                        : isListening
                                        ? t.ai.listeningPlaceholder
                                        : authLoading
                                        ? t.common.loading
                                        : attachedImage
                                        ? t.ai.askAboutImagePlaceholder
                                        : t.ai.typeMessagePlaceholder
                                }
                                rows={1}
                                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none min-h-[36px] max-h-[120px]"
                                style={{height: 'auto', overflow: 'auto'}}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement
                                    target.style.height = 'auto'
                                    target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                                }}
                            />

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground border border-border/50 rounded"
                                    onClick={() => {
                                        const next = speechLang === 'bg-BG' ? 'en-US' : 'bg-BG'
                                        setSpeechLang(next)
                                        if (isListening) {
                                            stopListening()
                                        }
                                    }}
                                    title={tFormat(t.ai.speechLangTitle, {lang: speechLang === 'bg-BG' ? t.ai.bulgarianLangName : t.ai.englishLangName})}
                                >
                                    {speechLang === 'bg-BG' ? 'BG' : 'EN'}
                                </Button>

                                <Button
                                    type="button"
                                    variant={isListening ? 'destructive' : isTranscribing ? 'secondary' : 'ghost'}
                                    size="icon"
                                    className={`shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all ${
                                        isListening
                                            ? 'animate-pulse ring-2 ring-destructive/40 shadow-sm bg-destructive text-destructive-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                                    onClick={() => {
                                        if (!isListening) {
                                            baseInputRef.current = input
                                        }
                                        toggleListening({ lang: speechLang })
                                    }}
                                    disabled={isTranscribing}
                                    title={
                                        isTranscribing
                                            ? t.ai.transcribingAudio
                                            : isListening
                                            ? t.ai.stopRecording
                                            : tFormat(t.ai.voiceInputLabel, {lang: speechLang === 'bg-BG' ? t.ai.bulgarianLangName : t.ai.englishLangName})
                                    }
                                    aria-label={isListening ? t.ai.stopRecording : t.ai.voiceInput}
                                >
                                    {isTranscribing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isListening ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitDisabled}
                                size="icon"
                                className="shrink-0 h-9 w-9 rounded-lg"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                ) : (
                                    <Send className="h-4 w-4"/>
                                )}
                            </Button>
                        </form>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            {t.ai.footerHint}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
