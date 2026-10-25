import {useCallback, useEffect, useRef, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {Fee} from '@workspace/shared'

export type {Fee}

type Totals = {collected: number; outstanding: number}

function computeTotals(fees: Fee[]): Totals {
    return {
        collected: fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
        outstanding: fees.filter((f) => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0),
    }
}

const feesCache = createResourceCache<{fees: Fee[]; totals: Totals}>()

export function useFees(enabled: boolean) {
    const cached = feesCache.get()
    const [fees, setFees] = useState<Fee[]>(cached?.fees ?? [])
    const [totals, setTotals] = useState<Totals>(cached?.totals ?? {collected: 0, outstanding: 0})
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    // Guards against a slow background refetch landing *after* setFeeStatus's
    // optimistic update and overwriting it with stale pre-update data, even
    // though the mutation itself already succeeded. Any operation bumps this
    // ref when it starts; a result only gets applied if it's still the most
    // recent one issued.
    const requestIdRef = useRef(0)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        const requestId = ++requestIdRef.current
        if (!feesCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/fees', {headers})
            const json = await res.json()
            if (requestId !== requestIdRef.current) return
            if (!res.ok) {
                setError(json.error || 'Failed to load fees')
                return
            }
            const totalsData = json.totals ?? {collected: 0, outstanding: 0}
            feesCache.set({fees: json.data, totals: totalsData})
            setFees(json.data)
            setTotals(totalsData)
            setError(null)
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to load fees')
            }
        } finally {
            if (requestId === requestIdRef.current) setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const generateFees = async (input: {
        period: string
        amount_mode: 'fixed' | 'per_sqm'
        amount: number
        due_date?: string | null
    }): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/fees', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to generate fees'}
        }
    }

    /**
     * Applies the new status immediately (no refetch round-trip) so the
     * button feels instant, then reconciles with the server in the
     * background and rolls back on failure. Keeps the cache in step with
     * every intermediate state so a remount mid-flight never shows stale
     * pre-update data.
     */
    const setFeeStatus = async (feeId: string, action: 'mark_paid' | 'mark_unpaid', method?: 'cash' | 'bank_transfer'): Promise<{success: boolean; error?: string}> => {
        // Supersede any refetch already in flight so its (now-stale) result
        // can't land after this and overwrite the optimistic update below.
        const requestId = ++requestIdRef.current
        const previousFees = fees
        const optimisticFees = fees.map((f) =>
            f.id === feeId
                ? {...f, status: action === 'mark_paid' ? ('paid' as const) : ('unpaid' as const), paid_at: action === 'mark_paid' ? new Date().toISOString() : null}
                : f,
        )
        const optimisticTotals = computeTotals(optimisticFees)
        setFees(optimisticFees)
        setTotals(optimisticTotals)
        feesCache.set({fees: optimisticFees, totals: optimisticTotals})

        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/fees/${feeId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({action, method}),
            })
            const json = await res.json()
            if (!res.ok) {
                if (requestId === requestIdRef.current) {
                    setFees(previousFees)
                    setTotals(computeTotals(previousFees))
                    feesCache.set({fees: previousFees, totals: computeTotals(previousFees)})
                }
                return {success: false, error: json.error}
            }
            const reconciled = optimisticFees.map((f) => (f.id === feeId ? {...f, ...json.data} : f))
            const reconciledTotals = computeTotals(reconciled)
            feesCache.set({fees: reconciled, totals: reconciledTotals})
            if (requestId === requestIdRef.current) {
                setFees(reconciled)
                setTotals(reconciledTotals)
            }
            return {success: true}
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setFees(previousFees)
                setTotals(computeTotals(previousFees))
                feesCache.set({fees: previousFees, totals: computeTotals(previousFees)})
            }
            return {success: false, error: err instanceof Error ? err.message : 'Failed to update fee'}
        }
    }

    return {fees, totals, loading, error, refetch, generateFees, setFeeStatus}
}
