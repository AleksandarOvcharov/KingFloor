import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {Announcement} from '@workspace/shared'

export type {Announcement}

const announcementsCache = createResourceCache<Announcement[]>()

export function useAnnouncements(enabled: boolean) {
    const cached = announcementsCache.get()
    const [announcements, setAnnouncements] = useState<Announcement[]>(cached ?? [])
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!announcementsCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/announcements', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load announcements')
                return
            }
            announcementsCache.set(json.data)
            setAnnouncements(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load announcements')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const createAnnouncement = async (input: {title: string; body: string; pinned?: boolean}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/announcements', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to create announcement'}
        }
    }

    const updateAnnouncement = async (id: string, input: {title?: string; body?: string; pinned?: boolean}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/announcements/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to update announcement'}
        }
    }

    const deleteAnnouncement = async (id: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/announcements/${id}`, {method: 'DELETE', headers})
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to delete announcement'}
        }
    }

    return {announcements, loading, error, refetch, createAnnouncement, updateAnnouncement, deleteAnnouncement}
}
