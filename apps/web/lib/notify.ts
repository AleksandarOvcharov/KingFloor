import {toast as sonnerToast} from 'sonner'
import type {ToastVariant} from '@/components/toast/types'

/**
 * One-line notification utility. Renders the same themed ToastItem
 * as useToast().addToast() but without needing hooks or providers.
 *
 * Usage:
 *   notify('Heads up', 'This is a default notification.')
 *   notify.success('Saved!', 'Your changes are live.')
 *   notify.error('Oops', 'Something went wrong.')
 *   notify.destructive('Deleted', 'This action cannot be undone.')
 */

// Lazy import to avoid circular deps and keep this file light.
// ToastItem is only loaded when a notification is actually fired.
let ToastItemModule: typeof import('@/components/toast/toast-item') | null = null

async function getToastItem() {
    if (!ToastItemModule) {
        ToastItemModule = await import('@/components/toast/toast-item')
    }
    return ToastItemModule.ToastItem
}

type NotifyOptions = {
    duration?: number
    action?: React.ReactNode
}

function fireToast(title: string, description?: string, variant: ToastVariant = 'default', opts?: NotifyOptions) {
    getToastItem().then((ToastItem) => {
        sonnerToast.custom(
            (t) => ToastItem({toast: {title, description, action: opts?.action}, variant, sonnerToastId: t}),
            {duration: opts?.duration ?? 3000},
        )
    })
}

function notify(title: string, description?: string, opts?: NotifyOptions) {
    fireToast(title, description, 'default', opts)
}

notify.success = (title: string, description?: string, opts?: NotifyOptions) =>
    fireToast(title, description, 'success', opts)

notify.error = (title: string, description?: string, opts?: NotifyOptions) =>
    fireToast(title, description, 'error', opts)

notify.destructive = (title: string, description?: string, opts?: NotifyOptions) =>
    fireToast(title, description, 'destructive', opts)

notify.dismiss = (id?: string | number) =>
    sonnerToast.dismiss(id)

export {notify}
