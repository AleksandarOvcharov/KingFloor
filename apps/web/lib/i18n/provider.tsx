'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {dictionaries, isLocale, LOCALE_COOKIE, tFormat, type Dictionary, type Locale} from './dictionaries'

export {tFormat}

const DEFAULT_LOCALE: Locale = 'bg'

function writeCookie(name: string, value: string) {
    if (typeof document === 'undefined') return
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
    document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax${isSecure ? '; Secure' : ''}`
}

interface I18nContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
    children: React.ReactNode
    /**
     * Locale resolved server-side from the `locale` cookie (see app/layout.tsx).
     * Using this instead of reading localStorage client-side means the very
     * first client render matches what the server already sent — no
     * hydration mismatch, and no flash of the wrong language.
     */
    initialLocale?: Locale
}

export function I18nProvider({children, initialLocale}: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE)

    // One-time migration for pre-existing visitors who only have the old
    // localStorage-only preference (no cookie yet, so the server couldn't
    // see it). After this, setLocale always keeps the cookie up to date.
    useEffect(() => {
        if (isLocale(initialLocale)) return
        try {
            const stored = window.localStorage.getItem(LOCALE_COOKIE)
            if (isLocale(stored) && stored !== locale) {
                setLocaleState(stored)
                writeCookie(LOCALE_COOKIE, stored)
            }
        } catch {
            /* ignore */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next)
        writeCookie(LOCALE_COOKIE, next)
        if (typeof document !== 'undefined') {
            document.documentElement.lang = next
        }
    }, [])

    const value = useMemo<I18nContextValue>(() => ({
        locale,
        setLocale,
        t: dictionaries[locale],
    }), [locale, setLocale])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext)
    if (!ctx) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return ctx
}
