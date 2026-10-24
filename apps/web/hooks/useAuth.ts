import {useEffect, useRef, useState} from 'react'
import {supabase} from '@/lib/supabase/client'
import type {User} from '@supabase/supabase-js'
import {clearAllBuildingCaches} from '@/lib/building/cache'

const syncAuthCookie = (token?: string | null) => {
    if (typeof document === 'undefined') return
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const secureFlag = isSecure ? '; Secure' : ''
    if (token) {
        document.cookie = `sb-auth-token=${token}; path=/; max-age=604800; SameSite=Lax${secureFlag}`
    } else {
        document.cookie = `sb-auth-token=; path=/; max-age=0; SameSite=Lax${secureFlag}`
    }
}

const getAuthCallbackUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/auth/callback`
    }
    const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    return `${siteUrl.replace(/\/$/, '')}/auth/callback`
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Supabase refreshes the access token whenever the tab regains focus
    // (alt-tab, switching windows), which fires onAuthStateChange with a
    // freshly-deserialized — but logically identical — user object. Handing
    // out a new object reference for the "same" user makes every downstream
    // useEffect/useCallback keyed on `user` (useBuilding, etc.) think the
    // user changed and re-fetch everything from scratch, flashing skeletons
    // all over the page for no reason. Keep the previous reference whenever
    // the user id didn't actually change, so unrelated hooks don't see a
    // "new" user and refetch on every tab-focus token refresh.
    const lastUserIdRef = useRef<string | null>(null)
    const applyUser = (next: User | null) => {
        const nextId = next?.id ?? null
        // A *real* transition between two different known users (including
        // sign-out) — not just the first load of this tab — means any
        // building data cached from the previous user no longer applies.
        if (lastUserIdRef.current !== null && lastUserIdRef.current !== nextId) {
            clearAllBuildingCaches()
        }
        lastUserIdRef.current = nextId
        setUser((prev) => (prev?.id === nextId ? prev : next))
    }

    useEffect(() => {
        let isMounted = true

        // Initial session retrieval
        const getUser = async () => {
            try {
                const {data: {session}, error} = await supabase.auth.getSession()
                if (!isMounted) return

                if (error || !session) {
                    applyUser(null)
                    syncAuthCookie(null)
                } else {
                    applyUser(session.user ?? null)
                    syncAuthCookie(session.access_token)
                }
            } catch {
                if (isMounted) {
                    applyUser(null)
                    syncAuthCookie(null)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        getUser()

        const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return

            if (event === 'SIGNED_OUT' || !session) {
                applyUser(null)
                syncAuthCookie(null)
                setLoading(false)
            } else if (session) {
                applyUser(session.user ?? null)
                syncAuthCookie(session.access_token)
                setLoading(false)
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const login = async (email: string, password: string) => {
        const cleanEmail = email.trim().toLowerCase()
        const {data, error} = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
        })
        if (!error && data.user) {
            applyUser(data.user)
        }
        return {data, error}
    }

    const signup = async (email: string, password: string) => {
        const cleanEmail = email.trim().toLowerCase()
        const {data, error} = await supabase.auth.signUp({
            email: cleanEmail,
            password,
        })
        if (!error && data.user) {
            applyUser(data.user)
        }
        return {data, error}
    }

    const signInWithGoogle = async () => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: getAuthCallbackUrl(),
            },
        })
        return {error}
    }

    const signInWithGitHub = async () => {
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: getAuthCallbackUrl(),
            },
        })
        return {error}
    }

    const logout = async () => {
        syncAuthCookie(null)
        await supabase.auth.signOut()
        applyUser(null)
    }

    const deleteAccount = async () => {
        const {data: {session}} = await supabase.auth.getSession()
        if (!session?.access_token) {
            return {error: {message: 'Not authenticated' } }
        }

        const res = await fetch('/api/auth/delete-account', {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        })

        const data = await res.json()
        if (!res.ok) {
            return {error: {message: data.error || 'Failed to delete account'}}
        }

        // Sign out locally after deletion
        syncAuthCookie(null)
        await supabase.auth.signOut()
        applyUser(null)
        return {error: null}
    }

    return {user, loading, login, signup, signInWithGoogle, signInWithGitHub, logout, deleteAccount}
}
