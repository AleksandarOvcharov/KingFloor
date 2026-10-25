import {useCallback, useEffect, useRef, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import {supabase} from '@/lib/supabase/client'
import type {BuildingChatMessage} from '@workspace/shared'

export type {BuildingChatMessage}

const chatCache = createResourceCache<BuildingChatMessage[]>()

/**
 * Live via a Supabase Realtime channel (WebSocket) subscribed to INSERTs on
 * building_chat_messages, filtered to this building — no polling. Realtime
 * only hands back the raw inserted row (no joined sender_name/avatar_url,
 * those are computed server-side in the API route), so a new-message event
 * just triggers a normal refetch instead of trying to merge a half-enriched
 * row into state.
 */
export function useChat(enabled: boolean, buildingId: string | undefined) {
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
        if (!enabled || !buildingId) return
        const channel = supabase
            .channel(`building-chat-${buildingId}`)
            .on(
                'postgres_changes',
                {event: 'INSERT', schema: 'public', table: 'building_chat_messages', filter: `building_id=eq.${buildingId}`},
                () => {
                    // Don't let an echo of our own just-sent message (or
                    // anyone else's mid-flight send) interleave weirdly with
                    // sendMessage's own optimistic append below.
                    if (!sendingRef.current) refetch()
                },
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [enabled, buildingId, refetch])

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
