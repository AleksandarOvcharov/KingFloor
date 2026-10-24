import {useCallback, useEffect, useState} from 'react'

const STORAGE_KEY = 'colorblind-mode'

const readStoredPreference = (): boolean => {
    if (typeof window === 'undefined') return false
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
        return false
    }
}

export function useAccessibility() {
    // Starts false to match the server-rendered markup exactly (there's no
    // SSR source for this preference), then syncs from localStorage right
    // after mount. Reading it synchronously in the initial state here would
    // make the client's first render disagree with the server's — a
    // hydration mismatch — for anything that renders colorblindMode
    // directly (the toggle's icon/aria-pressed, the settings page Switch).
    const [colorblindMode, setColorblindModeState] = useState<boolean>(false)

    useEffect(() => {
        const stored = readStoredPreference()
        if (stored) setColorblindModeState(true)
    }, [])

    useEffect(() => {
        document.documentElement.classList.toggle('colorblind', colorblindMode)
    }, [colorblindMode])

    const setColorblindMode = useCallback((enabled: boolean) => {
        setColorblindModeState(enabled)
        try {
            window.localStorage.setItem(STORAGE_KEY, String(enabled))
        } catch {
            /* ignore */
        }
    }, [])

    const toggleColorblindMode = useCallback(() => {
        setColorblindMode(!colorblindMode)
    }, [colorblindMode, setColorblindMode])

    return {colorblindMode, setColorblindMode, toggleColorblindMode}
}
