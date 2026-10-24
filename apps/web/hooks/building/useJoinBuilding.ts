import {useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import type {Building, JoinableUnit} from '@workspace/shared'

export function useJoinBuilding() {
    const [result, setResult] = useState<{building: Pick<Building, 'id' | 'name' | 'address'>; units: JoinableUnit[]} | null>(null)
    const [loading, setLoading] = useState(false)

    const lookup = async (code: string): Promise<{success: boolean; error?: string}> => {
        setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/lookup?code=${encodeURIComponent(code)}`, {headers})
            const json = await res.json()
            if (!res.ok) {
                setResult(null)
                return {success: false, error: json.error}
            }
            setResult(json.data)
            return {success: true}
        } catch (err) {
            setResult(null)
            return {success: false, error: err instanceof Error ? err.message : 'Failed to look up building'}
        } finally {
            setLoading(false)
        }
    }

    const reset = () => setResult(null)

    const join = async (code: string, unitId: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/join', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({invite_code: code, unit_id: unitId}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to join building'}
        }
    }

    return {result, loading, lookup, join, reset}
}
