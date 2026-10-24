import {useEffect, useState} from 'react'
import {supabase} from '@/lib/supabase/client'
import type {User} from '@supabase/supabase-js'

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

    useEffect(() => {
        let isMounted = true

        // Initial session retrieval
        const getUser = async () => {
            try {
                const {data: {session}, error} = await supabase.auth.getSession()
                if (!isMounted) return

                if (error || !session) {
                    setUser(null)
                    syncAuthCookie(null)
                } else {
                    setUser(session.user ?? null)
                    syncAuthCookie(session.access_token)
                }
            } catch {
                if (isMounted) {
                    setUser(null)
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
                setUser(null)
                syncAuthCookie(null)
                setLoading(false)
            } else if (session) {
                setUser(session.user ?? null)
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
            setUser(data.user)
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
            setUser(data.user)
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
        setUser(null)
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
        setUser(null)
        return {error: null}
    }

    return {user, loading, login, signup, signInWithGoogle, signInWithGitHub, logout, deleteAccount}
}
