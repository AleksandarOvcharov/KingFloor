import {supabase} from '@/lib/supabase/client'

/**
 * Get Authorization headers with the current session's access token.
 * Returns empty object if no session is available.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const {data: {session}} = await supabase.auth.getSession()
    if (!session?.access_token) return {}
    return {Authorization: `Bearer ${session.access_token}`}
}
