'use client'

import {cn} from '@/lib/utils'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {CheckCircle2, Loader2, XCircle} from 'lucide-react'

interface UploadProgressProps {
    progress: number
    uploading: boolean
    error?: string | null
    className?: string
}

export function UploadProgress({
    progress,
    uploading,
    error,
    className,
}: UploadProgressProps) {
    const {t} = useI18n()
    const done = !uploading && progress === 100 && !error

    if (!uploading && progress === 0 && !error) return null

    return (
        <div className={cn('space-y-2', className)}>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-300 ease-out',
                        error
                            ? 'bg-destructive'
                            : done
                              ? 'bg-success'
                              : 'bg-primary',
                    )}
                    style={{width: `${progress}%`}}
                />
            </div>

            {/* Status text */}
            <div className="flex items-center gap-1.5">
                {uploading && (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {tFormat(t.upload.uploadingProgress, {percent: progress})}
                        </span>
                    </>
                )}
                {done && (
                    <>
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        <span className="text-xs text-success">
                            {t.upload.uploadComplete}
                        </span>
                    </>
                )}
                {error && (
                    <>
                        <XCircle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">{error}</span>
                    </>
                )}
            </div>
        </div>
    )
}
