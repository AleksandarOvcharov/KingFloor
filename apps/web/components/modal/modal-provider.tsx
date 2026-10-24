'use client'

import * as React from 'react'
import {Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle} from '@/components/modal/modal'
import {Button} from '@workspace/ui/ui/button'

// ---------------------------------------------------------------------------
// ModalProvider — programmatic modals via context
// ---------------------------------------------------------------------------

export interface ConfirmOptions {
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export interface AlertOptions {
    title: string
    description?: string
    buttonLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

interface ModalContextType {
    /** Show a confirmation dialog. Resolves true if confirmed, false if cancelled. */
    confirm: (options: ConfirmOptions) => Promise<boolean>
    /** Show an alert dialog. Resolves when dismissed. */
    alert: (options: AlertOptions) => Promise<void>
}

const ModalContext = React.createContext<ModalContextType | undefined>(undefined)

type PendingModal =
    | { type: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
    | { type: 'alert'; options: AlertOptions; resolve: () => void }

export function ModalProvider({children}: { children: React.ReactNode }) {
    const [pending, setPending] = React.useState<PendingModal | null>(null)
    const [open, setOpen] = React.useState(false)

    const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setPending({type: 'confirm', options, resolve})
            setOpen(true)
        })
    }, [])

    const alert = React.useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            setPending({type: 'alert', options, resolve})
            setOpen(true)
        })
    }, [])

    function handleClose() {
        setOpen(false)
        if (pending?.type === 'confirm') {
            pending.resolve(false)
        } else if (pending?.type === 'alert') {
            pending.resolve()
        }
        setPending(null)
    }

    function handleConfirm() {
        setOpen(false)
        if (pending?.type === 'confirm') {
            pending.resolve(true)
        } else if (pending?.type === 'alert') {
            pending.resolve()
        }
        setPending(null)
    }

    return (
        <ModalContext.Provider value={{confirm, alert}}>
            {children}

            {pending && (
                <Modal
                    open={open}
                    onClose={handleClose}
                    size={pending.options.size || 'sm'}
                    showCloseButton={false}
                >
                    <ModalHeader>
                        <ModalTitle>{pending.options.title}</ModalTitle>
                        {pending.options.description && (
                            <ModalDescription>{pending.options.description}</ModalDescription>
                        )}
                    </ModalHeader>
                    <ModalBody/>
                    <ModalFooter>
                        {pending.type === 'confirm' ? (
                            <>
                                <Button variant="outline" onClick={handleClose}>
                                    {pending.options.cancelLabel || 'Cancel'}
                                </Button>
                                <Button
                                    variant={pending.options.variant === 'destructive' ? 'destructive' : 'default'}
                                    onClick={handleConfirm}
                                >
                                    {pending.options.confirmLabel || 'Confirm'}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleConfirm}>
                                {(pending.options as AlertOptions).buttonLabel || 'OK'}
                            </Button>
                        )}
                    </ModalFooter>
                </Modal>
            )}
        </ModalContext.Provider>
    )
}

/**
 * Hook for programmatic confirm/alert modals.
 * Must be used within a ModalProvider.
 */
export function useModalContext(): ModalContextType {
    const context = React.useContext(ModalContext)
    if (!context) {
        throw new Error('useModalContext must be used within a ModalProvider')
    }
    return context
}
