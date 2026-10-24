import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {Unit} from '@workspace/shared'

export type {Unit}

const unitsCache = createResourceCache<Unit[]>()

/** Units management — admins see/manage all, residents see their own unit. */
export function useUnits(enabled: boolean) {
    const cached = unitsCache.get()
    const [units, setUnits] = useState<Unit[]>(cached ?? [])
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!unitsCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/units', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load units')
                return
            }
            unitsCache.set(json.data)
            setUnits(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load units')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const addUnit = async (input: {
        number: string
        floor?: number | null
        area_sqm?: number | null
    }): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/units', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to add unit'}
        }
    }

    const updateUnit = async (
        id: string,
        input: {number?: string; floor?: number | null; area_sqm?: number | null},
    ): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/units/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to update unit'}
        }
    }

    const deleteUnit = async (id: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/units/${id}`, {method: 'DELETE', headers})
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to delete unit'}
        }
    }

    const assignResident = async (email: string, unit_id: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/members', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({email, unit_id, role: 'resident'}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to assign resident'}
        }
    }

    const unassignResident = async (memberId: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/members/${memberId}`, {method: 'DELETE', headers})
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to remove resident'}
        }
    }

    return {units, loading, error, refetch, addUnit, updateUnit, deleteUnit, assignResident, unassignResident}
}
