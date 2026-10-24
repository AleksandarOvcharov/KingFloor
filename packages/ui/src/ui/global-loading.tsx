'use client'

import * as React from 'react'
import {cn} from '@workspace/ui/lib/utils'

/* ─── Top Bar Loading Indicator ─── */

interface TopLoaderProps {
    /** Whether the loader is visible */
    loading: boolean
    /** Color — defaults to primary */
    className?: string
}

/**
 * Slim animated bar at the top of the viewport. Shows during async operations.
 *
 * Usage:
 *   const [loading, setLoading] = useState(false)
 *   <TopLoader loading={loading} />
 */
function TopLoader({loading, className}: TopLoaderProps) {
    if (!loading) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5" role="progressbar" aria-label="Loading">
            <div
                className={cn(
                    'h-full bg-primary animate-top-loader',
                    className,
                )}
            />
        </div>
    )
}

TopLoader.displayName = 'TopLoader'

/* ─── Fullscreen Overlay Loader ─── */

interface OverlayLoaderProps {
    loading: boolean
    /** Text shown below the spinner */
    message?: string
    className?: string
}

/**
 * Centered overlay spinner for blocking operations.
 *
 * Usage:
 *   <OverlayLoader loading={saving} message="Saving changes..." />
 */
function OverlayLoader({loading, message, className}: OverlayLoaderProps) {
    if (!loading) return null

    return (
        <div className={cn('fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm', className)} role="status" aria-label={message || 'Loading'}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"/>
            {message && (
                <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            )}
        </div>
    )
}

OverlayLoader.displayName = 'OverlayLoader'

/* ─── Centered Loading Screen ─── */

interface LoadingScreenProps {
    /** Optional text message shown below spinner (default: 'Loading...') */
    message?: string
    /** Optional className for container */
    className?: string
    /** Size of the spinner in pixels (default: 36) */
    spinnerSize?: number
}

/**
 * Centered full-area loading screen with rotating spinner animation.
 *
 * Usage:
 *   if (loading) return <LoadingScreen message="Loading dashboard..." />
 */
function LoadingScreen({message = 'Loading...', className, spinnerSize = 36}: LoadingScreenProps) {
    return (
        <div
            className={cn('min-h-[50vh] flex-1 flex flex-col items-center justify-center p-6 gap-3', className)}
            role="status"
            aria-label={message}
        >
            <div
                className="animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"
                style={{width: spinnerSize, height: spinnerSize}}
            />
            {message && (
                <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
            )}
        </div>
    )
}

LoadingScreen.displayName = 'LoadingScreen'

/* ─── Standalone Spinner Component ─── */

interface LoadingSpinnerProps {
    /** Size in pixels (default: 24) */
    size?: number
    className?: string
}

function LoadingSpinner({size = 24, className}: LoadingSpinnerProps) {
    return (
        <div
            className={cn('inline-block animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary', className)}
            style={{width: size, height: size}}
            role="status"
            aria-label="Loading"
        />
    )
}

LoadingSpinner.displayName = 'LoadingSpinner'

/* ─── Inline Spinner (for buttons or small areas) ─── */

interface InlineLoaderProps {
    loading: boolean
    /** Size in pixels (default: 16) */
    size?: number
    className?: string
}

/**
 * Small inline spinner for buttons or compact areas.
 *
 * Usage:
 *   <Button disabled={loading}>
 *     <InlineLoader loading={loading} />
 *     {loading ? 'Saving...' : 'Save' }
 *   </Button>
 */
function InlineLoader({loading, size = 16, className}: InlineLoaderProps) {
    if (!loading) return null

    return (
        <div
            className={cn('inline-block animate-spin rounded-full border-2 border-current/30 border-t-current', className)}
            style={{width: size, height: size}}
            role="status"
            aria-label="Loading"
        />
    )
}

InlineLoader.displayName = 'InlineLoader'

export {TopLoader, OverlayLoader, LoadingScreen, LoadingSpinner, InlineLoader}
