import {useCallback, useEffect, useState} from 'react'
import type {User} from '@supabase/supabase-js'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {BuildingMembership} from '@workspace/shared'

export type {BuildingMembership}

const membershipCache = createResourceCache<BuildingMembership | null>()

/**
 * The current user's building membership (building + role + own unit), or
 * `null` once loaded if they haven't joined/created a building yet.
 *
 * Seeds from the in-session cache so leaving /building and coming back
 * (which unmounts/remounts BuildingProvider) shows the sidebar instantly
 * instead of a skeleton, then quietly revalidates in the background.
 */
export function useBuilding(user: User | null) {
    const cached = membershipCache.get()
    const [membership, setMembership] = useState<BuildingMembership | null>(cached ?? null)
    const [loading, setLoading] = useState(cached === undefined)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!user) {
            setMembership(null)
            setLoading(false)
            return
        }
        if (membershipCache.get() === undefined) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load building')
                return
            }
            membershipCache.set(json.data)
            setMembership(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load building')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        refetch()
    }, [refetch])

    const createBuilding = async (name: string, address?: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({name, address}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to create building'}
        }
    }

    const updateBuilding = async (input: {name?: string; address?: string | null; iban?: string | null}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to update building'}
        }
    }

    return {membership, loading, error, refetch, createBuilding, updateBuilding}
}
