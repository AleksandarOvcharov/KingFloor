/**
 * Tiny per-session, in-memory "stale-while-revalidate" cache for the
 * building hooks (useFees, useAnnouncements, usePolls, useIssues,
 * useExpenses, useUnits, useBuilding, useFinanceSummary).
 *
 * Every /building/* page mounts its own data hook, so navigating away and
 * back (or even just revisiting a tab you already loaded) used to re-fetch
 * from scratch and flash a skeleton every single time — even though
 * nothing had changed. A hook seeds its state from this cache synchronously
 * on mount (instant, no skeleton) and still fetches in the background to
 * keep it fresh; the skeleton only shows the very first time a resource is
 * ever loaded this session.
 *
 * Deliberately module-level (not React state/context): it needs to survive
 * the unmount/remount of whichever page is using it, for the lifetime of
 * the page (cleared on a real browser reload automatically, since the JS
 * module re-evaluates). Must be cleared on logout/user-switch — see
 * clearAllBuildingCaches(), called from useAuth.
 */

type ClearFn = () => void

const registry: ClearFn[] = []

export interface ResourceCache<T> {
    get: () => T | undefined
    set: (value: T) => void
}

export function createResourceCache<T>(): ResourceCache<T> {
    let value: T | undefined

    registry.push(() => {
        value = undefined
    })

    return {
        get: () => value,
        set: (v: T) => {
            value = v
        },
    }
}

/** Called when the signed-in user changes (sign out, or a different account signs in). */
export function clearAllBuildingCaches() {
    for (const clear of registry) clear()
}
