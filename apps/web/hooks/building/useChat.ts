import {useCallback, useEffect, useRef, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {BuildingChatMessage} from '@workspace/shared'

export type {BuildingChatMessage}

const POLL_INTERVAL_MS = 4000

const chatCache = createResourceCache<BuildingChatMessage[]>()

/**
 * Polls instead of a real Supabase Realtime subscription — simplest thing
 * that makes a shared chat feel alive without adding a channel/publication
 * setup. Good enough for a building-sized group; swap for Realtime if this
 * ever needs to scale past that.
 */
export function useChat(enabled: boolean) {
    const cached = chatCache.get()
    const [messages, setMessages] = useState<BuildingChatMessage[]>(cached ?? [])
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)
    const sendingRef = useRef(false)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!chatCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/chat', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load messages')
                return
            }
            chatCache.set(json.data)
            setMessages(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load messages')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    useEffect(() => {
        if (!enabled) return
        const interval = setInterval(() => {
            // Don't let a poll tick clobber a send that's still in flight.
            if (!sendingRef.current) refetch()
        }, POLL_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [enabled, refetch])

    const sendMessage = async (body: string): Promise<{success: boolean; error?: string}> => {
        sendingRef.current = true
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({body}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            const next = [...messages, json.data]
            chatCache.set(next)
            setMessages(next)
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to send message'}
        } finally {
            sendingRef.current = false
        }
    }

    return {messages, loading, error, refetch, sendMessage}
}
