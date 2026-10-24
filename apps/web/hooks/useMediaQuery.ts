'use client'

import {useState, useEffect} from 'react'

/**
 * Hook that listens to a CSS media query and returns whether it matches.
 *
 * @param query - CSS media query string, e.g. "(min-width: 768px)"
 * @returns boolean indicating if the query currently matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia(query)
        setMatches(mql.matches)

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [query])

    return matches
}

/** Common breakpoint helpers — mirrors Tailwind's default breakpoints. */
export function useIsMobile(): boolean {
    return !useMediaQuery('(min-width: 768px)')
}

export function useIsTablet(): boolean {
    const isMinMd = useMediaQuery('(min-width: 768px)')
    const isMinLg = useMediaQuery('(min-width: 1024px)')
    return isMinMd && !isMinLg
}

export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)')
}

/**
 * Returns the current Tailwind breakpoint name.
 * Useful for conditional rendering based on screen size.
 */
export function useBreakpoint(): 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    const md = useMediaQuery('(min-width: 768px)')
    const lg = useMediaQuery('(min-width: 1024px)')
    const xl = useMediaQuery('(min-width: 1280px)')
    const xxl = useMediaQuery('(min-width: 1536px)')

    if (xxl) return '2xl'
    if (xl) return 'xl'
    if (lg) return 'lg'
    if (md) return 'md'
    return 'sm'
}

/**
 * Detects user's motion preference for reduced-motion accessibility.
 */
export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Detects user's color scheme preference (independent of app theme toggle).
 */
export function usePrefersColorScheme(): 'dark' | 'light' {
    const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
    return prefersDark ? 'dark' : 'light'
}
