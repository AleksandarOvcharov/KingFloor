import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/lib/supabase/client'
import type {User} from '@supabase/supabase-js'
import {useI18n} from '@/lib/i18n/provider'
import type {UserProfile} from '@workspace/shared'

export type {UserProfile}

const CACHE_KEY = 'cached_profile'

const getCachedProfile = (): UserProfile | null => {
    if (typeof window === 'undefined') return null
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        return cached ? JSON.parse(cached) : null
    } catch {
        return null
    }
}

const cacheProfile = (data: UserProfile) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch { /* ignore */
    }
}

const clearCachedProfile = () => {
    if (typeof window === 'undefined') return
    try {
        localStorage.removeItem(CACHE_KEY)
    } catch { /* ignore */
    }
}

export function useProfile(user: User | null) {
    const {t} = useI18n()
    // Seed from cache synchronously so a returning visit never has to wait
    // on the network round-trip just to paint the right username.
    const [profile, setProfile] = useState<UserProfile | null>(() => getCachedProfile())
    const [loading, setLoading] = useState<boolean>(() => !getCachedProfile())
    const [error, setError] = useState<string | null>(null)

    const userId = user?.id

    const fetchProfile = useCallback(async () => {
        if (!userId) return

        try {
            const {data, error: fetchError} = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (fetchError) {
                setError(fetchError.message)
                return
            }
            setProfile(data)
            cacheProfile(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t.settings.failedToFetchProfile)
        } finally {
            setLoading(false)
        }
    }, [userId, t])

    useEffect(() => {
        if (!userId) {
            setProfile(null)
            setLoading(false)
            clearCachedProfile()
            return
        }

        // Reconcile the synchronously-seeded cache against the resolved user,
        // then fetch fresh data in the background either way.
        const cached = getCachedProfile()
        if (cached && cached.id === userId) {
            setProfile(cached)
            setLoading(false)
        } else {
            setProfile(null)
            setLoading(true)
        }

        fetchProfile()
    }, [userId, fetchProfile])

    const getAccessToken = async (): Promise<string | null> => {
        const {data: {session}} = await supabase.auth.getSession()
        return session?.access_token ?? null
    }

    const updateUsername = async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return {success: false, error: 'Not authenticated'}

        const token = await getAccessToken()
        if (!token) return {success: false, error: 'Session expired — please log in again'}

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({username: newUsername}),
            })

            const json = await res.json()

            if (!res.ok) {
                return {success: false, error: json.error}
            }

            setProfile(json.data)
            cacheProfile(json.data)
            return {success: true}
        } catch (err: unknown) {
            return {success: false, error: err instanceof Error ? err.message : t.settings.usernameUpdateFailed}
        }
    }

    const updateVisibility = async (isPublic: boolean): Promise<{ success: boolean; error?: string }> => {
        if (!user) return {success: false, error: 'Not authenticated'}

        const token = await getAccessToken()
        if (!token) return {success: false, error: 'Session expired — please log in again'}

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({is_public: isPublic}),
            })

            const json = await res.json()

            if (!res.ok) {
                return {success: false, error: json.error}
            }

            setProfile(json.data)
            cacheProfile(json.data)
            return {success: true}
        } catch (err: unknown) {
            return {success: false, error: err instanceof Error ? err.message : t.settings.visibilityUpdateFailed}
        }
    }

    const updateBio = async (newBio: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return {success: false, error: 'Not authenticated'}

        const token = await getAccessToken()
        if (!token) return {success: false, error: 'Session expired — please log in again'}

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({bio: newBio}),
            })

            const json = await res.json()

            if (!res.ok) {
                return {success: false, error: json.error}
            }

            setProfile(json.data)
            cacheProfile(json.data)
            return {success: true}
        } catch (err: unknown) {
            return {success: false, error: err instanceof Error ? err.message : t.settings.bioUpdateFailed}
        }
    }

    const updateExtended = async (fields: {
        display_name?: string | null
        location?: string | null
        website?: string | null
        twitter_handle?: string | null
        github_handle?: string | null
    }): Promise<{ success: boolean; error?: string }> => {
        if (!user) return {success: false, error: 'Not authenticated'}

        const token = await getAccessToken()
        if (!token) return {success: false, error: 'Session expired — please log in again'}

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(fields),
            })

            const json = await res.json()

            if (!res.ok) {
                return {success: false, error: json.error}
            }

            setProfile(json.data)
            cacheProfile(json.data)
            return {success: true}
        } catch (err: unknown) {
            return {success: false, error: err instanceof Error ? err.message : t.settings.profileInfoUpdateFailed}
        }
    }

    const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string }> => {
        if (!user) return {success: false, error: 'Not authenticated'}

        const ext = file.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`

        try {
            const {error: uploadError} = await supabase.storage
                .from('avatars')
                .upload(path, file, {upsert: true})

            if (uploadError) {
                return {success: false, error: uploadError.message}
            }

            const {data: {publicUrl}} = supabase.storage
                .from('avatars')
                .getPublicUrl(path)

            const token = await getAccessToken()
            if (!token) return {success: false, error: 'Session expired — please log in again'}

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({avatar_url: publicUrl}),
            })

            const json = await res.json()

            if (!res.ok) {
                return {success: false, error: json.error}
            }

            setProfile(json.data)
            cacheProfile(json.data)
            return {success: true}
        } catch (err: unknown) {
            return {success: false, error: err instanceof Error ? err.message : t.settings.avatarUpdateFailed}
        }
    }

    return {
        profile,
        loading,
        error,
        updateUsername,
        updateBio,
        uploadAvatar,
        updateExtended,
        updateVisibility,
        refetch: fetchProfile,
    }
}
