'use client'

import React, {Component, Suspense} from 'react'
import {LoadingState} from '@workspace/ui/ui/loading-state'
import {Button} from '@workspace/ui/ui/button'
import {AlertCircle, RefreshCw} from 'lucide-react'

/* ─── Error Boundary (class component — React requirement) ─── */

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    onError?: (error: Error, info: React.ErrorInfo) => void
    onReset?: () => void
}

interface ErrorBoundaryState {
    error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = {error: null}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {error}
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.props.onError?.(error, info)
    }

    reset = () => {
        this.setState({error: null})
        this.props.onReset?.()
    }

    render() {
        if (this.state.error) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive"/>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {this.state.error.message || 'An unexpected error occurred.'}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={this.reset}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Try again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}

/* ─── AsyncBoundary ─── */

interface AsyncBoundaryProps {
    children: React.ReactNode
    /** Loading fallback — defaults to LoadingState with list variant */
    loading?: React.ReactNode
    /** Error fallback — defaults to styled error card with retry */
    error?: React.ReactNode
    /** Loading variant when using default fallback */
    loadingVariant?: 'list' | 'card' | 'profile' | 'table'
    /** Number of skeleton rows for default loading fallback */
    loadingRows?: number
    /** Called when an error is caught */
    onError?: (error: Error, info: React.ErrorInfo) => void
    /** Called when the user clicks "Try again" */
    onReset?: () => void
}

/**
 * Wraps children with Suspense (loading) + ErrorBoundary (errors).
 *
 * Usage:
 * ```tsx
 * <AsyncBoundary loadingVariant="card">
 *   <MyAsyncComponent />
 * </AsyncBoundary>
 * ```
 */
export function AsyncBoundary({
    children,
    loading,
    error,
    loadingVariant = 'list',
    loadingRows = 3,
    onError,
    onReset,
}: AsyncBoundaryProps) {
    const loadingFallback = loading ?? (
        <div className="p-4">
            <LoadingState variant={loadingVariant} rows={loadingRows}/>
        </div>
    )

    return (
        <ErrorBoundary fallback={error} onError={onError} onReset={onReset}>
            <Suspense fallback={loadingFallback}>
                {children}
            </Suspense>
        </ErrorBoundary>
    )
}

AsyncBoundary.displayName = 'AsyncBoundary'

export {ErrorBoundary}
