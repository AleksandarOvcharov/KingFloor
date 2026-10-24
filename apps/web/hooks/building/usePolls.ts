import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {Poll} from '@workspace/shared'

export type {Poll}

const pollsCache = createResourceCache<Poll[]>()

export function usePolls(enabled: boolean) {
    const cached = pollsCache.get()
    const [polls, setPolls] = useState<Poll[]>(cached ?? [])
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!pollsCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/polls', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load votes')
                return
            }
            pollsCache.set(json.data)
            setPolls(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load votes')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const createPoll = async (input: {title: string; description?: string; closes_at?: string | null; options: {label: string; attachment_url?: string; attachment_name?: string}[]}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/polls', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to create vote'}
        }
    }

    const castVote = async (pollId: string, optionId: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/polls/${pollId}/vote`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({option_id: optionId}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to vote'}
        }
    }

    const closePoll = async (pollId: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/polls/${pollId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to close vote'}
        }
    }

    const deletePoll = async (pollId: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/polls/${pollId}`, {method: 'DELETE', headers})
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to delete vote'}
        }
    }

    return {polls, loading, error, refetch, createPoll, castVote, closePoll, deletePoll}
}
