import {useCallback, useEffect, useRef, useState} from 'react'
import type {User} from '@supabase/supabase-js'
import {getAuthHeaders} from '@/lib/api/client'
import type {ChatMessage} from '@/hooks/useAI'

export interface Conversation {
    id: string
    title: string
    created_at: string
    updated_at: string
}

interface UseChatHistoryReturn {
    /** All conversations for the current user */
    conversations: Conversation[]
    /** Currently active conversation ID */
    activeConversationId: string | null
    /** Create a new conversation and set it as active */
    createConversation: () => Promise<string>
    /** Switch to an existing conversation (loads its messages) */
    selectConversation: (id: string) => Promise<ChatMessage[]>
    /** Delete a conversation */
    deleteConversation: (id: string) => Promise<void>
    /** Save a message to a conversation (defaults to active conversation) */
    saveMessage: (role: 'user' | 'model', content: string, conversationId?: string) => Promise<void>
    /** Whether history is loading */
    loading: boolean
}

/**
 * Hook for managing per-user chat history via Supabase.
 * Each user has their own isolated conversations and messages.
 */
export function useChatHistory(user: User | null): UseChatHistoryReturn {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const activeIdRef = useRef(activeConversationId)

    const userId = user?.id

    useEffect(() => {
        activeIdRef.current = activeConversationId
    }, [activeConversationId])

    const loadConversations = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/ai/history', {headers})
            const json = await res.json()
            if (res.ok && json.data) {
                setConversations(json.data)
            }
        } finally {
            setLoading(false)
        }
    }, [userId])

    // Load conversations when user changes
    useEffect(() => {
        if (!userId) {
            setConversations([])
            setActiveConversationId(null)
            return
        }
        loadConversations()
    }, [userId, loadConversations])

    const createConversation = useCallback(async (): Promise<string> => {
        if (!user) throw new Error('Must be logged in')

        const headers = await getAuthHeaders()
        const res = await fetch('/api/ai/history', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...headers},
            body: JSON.stringify({}),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)

        const convo = json.data as Conversation
        setConversations(prev => [convo, ...prev])
        setActiveConversationId(convo.id)
        return convo.id
    }, [user])

    const selectConversation = useCallback(async (id: string): Promise<ChatMessage[]> => {
        setActiveConversationId(id)
        setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/ai/history/messages?conversation_id=${id}`, {headers})
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            return (json.data || []).map(
                (m: { role: string; content: string }): ChatMessage => {
                    const imageMatch = m.content.match(/^!\[Image]\((data:image\/[^)]+|https?:\/\/[^)]+)\)\n*([\s\S]*)$/)
                    if (imageMatch) {
                        return {
                            role: m.role as 'user' | 'model',
                            imageUrl: imageMatch[1],
                            parts: [{text: imageMatch[2]}],
                        }
                    }
                    return {
                        role: m.role as 'user' | 'model',
                        parts: [{text: m.content}],
                    }
                }
            )
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteConversation = useCallback(async (id: string) => {
        const headers = await getAuthHeaders()
        const res = await fetch(`/api/ai/history?id=${id}`, {method: 'DELETE', headers})
        if (!res.ok) {
            const json = await res.json()
            throw new Error(json.error)
        }
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeIdRef.current === id) {
            setActiveConversationId(null)
        }
    }, [])

    const saveMessage = useCallback(async (role: 'user' | 'model', content: string, conversationId?: string) => {
        const targetId = conversationId || activeIdRef.current
        if (!targetId) return

        const headers = await getAuthHeaders()
        const res = await fetch('/api/ai/history/messages', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...headers},
            body: JSON.stringify({conversation_id: targetId, role, content}),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)

        // Update active conversation title locally if it was "New Chat"
        if (role === 'user') {
            setConversations(prev =>
                prev.map(c => {
                    if (c.id === targetId && c.title === 'New Chat') {
                        let cleanText = content.replace(/^!\[Image]\([^)]+\)\s*/, '').trim()
                        if (!cleanText) cleanText = 'Image Analysis'
                        const title = cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText
                        return {...c, title, updated_at: new Date().toISOString()}
                    }
                    return c
                })
            )
        }
    }, [])

    return {
        conversations,
        activeConversationId,
        createConversation,
        selectConversation,
        deleteConversation,
        saveMessage,
        loading,
    }
}
