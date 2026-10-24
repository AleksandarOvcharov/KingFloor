import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import {createResourceCache} from '@/lib/building/cache'
import type {IssuePriority, IssueStatus, MaintenanceIssue} from '@workspace/shared'

export type {MaintenanceIssue}

const issuesCache = createResourceCache<MaintenanceIssue[]>()

export function useIssues(enabled: boolean) {
    const cached = issuesCache.get()
    const [issues, setIssues] = useState<MaintenanceIssue[]>(cached ?? [])
    const [loading, setLoading] = useState(!cached)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) {
            setLoading(false)
            return
        }
        if (!issuesCache.get()) setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/issues', {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load issues')
                return
            }
            issuesCache.set(json.data)
            setIssues(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load issues')
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        refetch()
    }, [refetch])

    const reportIssue = async (input: {title: string; description?: string; priority?: IssuePriority}): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch('/api/building/issues', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify(input),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to report issue'}
        }
    }

    const updateStatus = async (issueId: string, status: IssueStatus): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/issues/${issueId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({status}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to update issue'}
        }
    }

    return {issues, loading, error, refetch, reportIssue, updateStatus}
}
