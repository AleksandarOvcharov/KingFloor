import type React from 'react'

export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type ToastVariant = 'default' | 'success' | 'error' | 'destructive'
export type ToastActionElement = React.ReactNode

export interface ToastData {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
    action?: ToastActionElement
    duration?: number
}

export interface ToastContextType {
    toasts: ToastData[]
    addToast: (toast: Omit<ToastData, 'id'>) => void
    removeToast: (id: string) => void
}
