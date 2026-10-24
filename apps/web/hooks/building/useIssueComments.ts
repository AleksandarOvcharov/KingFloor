import {useCallback, useEffect, useState} from 'react'
import {getAuthHeaders} from '@/lib/api/client'
import type {MaintenanceComment} from '@workspace/shared'

export type {MaintenanceComment}

/** Comments for one maintenance issue — only fetched once the thread is expanded. */
export function useIssueComments(issueId: string, enabled: boolean) {
    const [comments, setComments] = useState<MaintenanceComment[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!enabled) return
        setLoading(true)
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/issues/${issueId}/comments`, {headers})
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'Failed to load comments')
                return
            }
            setComments(json.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load comments')
        } finally {
            setLoading(false)
        }
    }, [enabled, issueId])

    useEffect(() => {
        refetch()
    }, [refetch])

    const addComment = async (body: string): Promise<{success: boolean; error?: string}> => {
        try {
            const headers = await getAuthHeaders()
            const res = await fetch(`/api/building/issues/${issueId}/comments`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...headers},
                body: JSON.stringify({body}),
            })
            const json = await res.json()
            if (!res.ok) return {success: false, error: json.error}
            await refetch()
            return {success: true}
        } catch (err) {
            return {success: false, error: err instanceof Error ? err.message : 'Failed to add comment'}
        }
    }

    return {comments, loading, error, refetch, addComment}
}
