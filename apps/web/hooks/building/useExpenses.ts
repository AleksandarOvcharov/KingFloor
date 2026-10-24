import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {Expense} from '@workspace/shared'

export type {Expense}

const expensesCache = createResourceCache<{expenses: Expense[]; total: number}>()

export function useExpenses(enabled: boolean) {
    const cached = expensesCache.get()
    const [expenses, setExpenses] = useState<Expense[]>(cached?.expenses ?? [])
    const [total, setTotal] = useState(cached?.total ?? 0)
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!expensesCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/expenses', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load expenses')
                return
            }
            const totalValue = json.total ?? 0
            expensesCache.set({expenses: json.data, total: totalValue})
            setExpenses(json.data)
            setTotal(totalValue)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load expenses')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const addExpense = async (input: {category: string; description?: string; amount: number; spent_at?: string}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/expenses', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to add expense'}
        }
    }

    return {expenses, total, loading, error, refetch, addExpense}
}
