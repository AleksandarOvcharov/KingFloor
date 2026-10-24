'use client'

import * as React from 'react'
import {toast as sonnerToast, Toaster as SonnerToaster} from 'sonner'
import {ToastItem} from './toast-item'
import type {ToastContextType, ToastData, ToastPosition} from './types'

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

let toastCount = 0

interface ToastProviderProps {
    children: React.ReactNode
    position?: ToastPosition
    duration?: number
}

export function ToastProvider({
    children,
    position = 'bottom-right',
    duration = 3000,
}: ToastProviderProps) {
    const [toasts, setToasts] = React.useState<ToastData[]>([])

    const addToast = React.useCallback((toast: Omit<ToastData, 'id'>) => {
        const id = String(++toastCount)
        const variant = toast.variant ?? 'default'

        setToasts((prev) => [...prev, {...toast, id}])

        sonnerToast.custom(
            (t) => (
                <ToastItem toast={toast} variant={variant} sonnerToastId={t}/>
            ),
            {
                duration: toast.duration ?? duration,
                onAutoClose: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
                onDismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
            },
        )
    }, [duration])

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{toasts, addToast, removeToast}}>
            {children}
            <SonnerToaster
                position={position}
                toastOptions={{unstyled: true, classNames: {toast: 'w-full'}}}
                gap={8}
            />
        </ToastContext.Provider>
    )
}
