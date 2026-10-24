'use client'

import {ErrorBoundary} from '@workspace/ui/ui/async-boundary'
import {Button} from '@workspace/ui/ui/button'
import {useI18n} from '@/lib/i18n/provider'
import {AlertCircle, RefreshCw} from 'lucide-react'

/**
 * Top-level error boundary for the entire app.
 * Catches unexpected errors in any page component during prototyping.
 */
export function AppErrorBoundary({children}: {children: React.ReactNode}) {
    const {t} = useI18n()
    return (
        <ErrorBoundary
            fallback={
                <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true"/>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">{t.errors.boundaryTitle}</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {t.errors.boundaryDescription}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        {t.errors.refreshPage}
                    </Button>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    )
}
