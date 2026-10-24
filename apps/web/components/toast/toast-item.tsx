import {toast as sonnerToast} from 'sonner'
import {CheckCircle, AlertCircle, AlertTriangle, Info, X} from 'lucide-react'
import {cn} from '@/lib/utils'
import type {ToastData, ToastVariant} from './types'

const variantIcon: Record<ToastVariant, React.ReactNode> = {
    default: <Info className="h-4 w-4 shrink-0 text-primary"/>,
    success: <CheckCircle className="h-4 w-4 shrink-0 text-success"/>,
    error: <AlertCircle className="h-4 w-4 shrink-0 text-destructive"/>,
    destructive: <AlertTriangle className="h-4 w-4 shrink-0 text-destructive"/>,
}

const variantStyles: Record<ToastVariant, string> = {
    default: 'border-border bg-background text-foreground',
    success: 'border-success/40 bg-background text-foreground',
    error: 'border-destructive/40 bg-background text-foreground',
    destructive: 'border-destructive bg-destructive text-destructive-foreground',
}

export function ToastItem({toast, variant, sonnerToastId}: {
    toast: Omit<ToastData, 'id'>
    variant: ToastVariant
    sonnerToastId: string | number
}) {
    return (
        <div
            className={cn(
                'flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 shadow-lg',
                variantStyles[variant],
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="mt-0.5" aria-hidden="true">{variantIcon[variant]}</div>
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                )}
                {toast.description && (
                    <p className={cn(
                        'text-sm opacity-80 leading-tight',
                        toast.title && 'mt-0.5',
                    )}>
                        {toast.description}
                    </p>
                )}
            </div>
            {toast.action}
            <button
                onClick={() => sonnerToast.dismiss(sonnerToastId)}
                className={cn(
                    'shrink-0 rounded p-0.5 transition-colors cursor-pointer',
                    variant === 'destructive'
                        ? 'text-destructive-foreground/60 hover:text-destructive-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                aria-label="Dismiss notification"
            >
                <X className="h-3.5 w-3.5" aria-hidden="true"/>
            </button>
        </div>
    )
}
