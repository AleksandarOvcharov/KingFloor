import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import {useI18n} from '@/lib/i18n/provider'
import type {FinanceSummary} from '@workspace/shared'

export type {FinanceSummary}

// Keyed by locale too — the month labels in monthlySeries are localized
// server-side, so a cached response from the other language would show
// briefly-wrong labels until the background refetch lands.
const summaryCache = createResourceCache<{locale: string; data: FinanceSummary}>()

/** Admin-only aggregate (balance, income/expense series, owner dues) for the dashboard. */
export function useFinanceSummary(enabled: boolean) {
    const {locale} = useI18n()
    const cached = summaryCache.get()
    const cachedForLocale = cached?.locale === locale ? cached.data : undefined
    const [summary, setSummary] = useState<FinanceSummary | null>(cachedForLocale ?? null)
    const [loading, setLoading] = useState(!cachedForLocale)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        const hasCacheForLocale = summaryCache.get()?.locale === locale
        if (!hasCacheForLocale) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/finance-summary?locale=${locale}`, {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load finance summary')
                return
            }
            summaryCache.set({locale, data: json.data})
            setSummary(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load finance summary')
        } finally {
            setLoading(false)
        }
    }, [enabled, locale])

    useEffect(() => {
        refetch()
    }, [refetch])

    return {summary, loading, error, refetch}
}
