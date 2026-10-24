'use client'

import * as React from 'react'

// ---------------------------------------------------------------------------
// useModal — simple state hook for controlling a modal
// ---------------------------------------------------------------------------

export interface UseModalReturn {
    /** Whether the modal is open */
    isOpen: boolean
    /** Open the modal, optionally passing data */
    open: (data?: unknown) => void
    /** Close the modal */
    close: () => void
    /** Toggle the modal open/closed */
    toggle: () => void
    /** Data passed when opening the modal */
    data: unknown
}

/**
 * Hook for controlling modal open/close state.
 *
 * @param initialOpen - Whether the modal starts open (default: false)
 * @returns Modal state and controls
 *
 * @example
 * ```tsx
 * const modal = useModal()
 *
 * <Button onClick={() => modal.open()}>Open</Button>
 * <Modal open={modal.isOpen} onClose={modal.close}>
 *   ...
 * </Modal>
 * ```
 *
 * @example With data
 * ```tsx
 * const deleteModal = useModal()
 *
 * <Button onClick={() => deleteModal.open({ id: item.id })}>Delete</Button>
 * <Modal open={deleteModal.isOpen} onClose={deleteModal.close}>
 *   <p>Delete item {(deleteModal.data as { id: string })?.id}?</p>
 * </Modal>
 * ```
 */
export function useModal(initialOpen = false): UseModalReturn {
    const [isOpen, setIsOpen] = React.useState(initialOpen)
    const [data, setData] = React.useState<unknown>(null)

    const open = React.useCallback((passedData?: unknown) => {
        setData(passedData ?? null)
        setIsOpen(true)
    }, [])

    const close = React.useCallback(() => {
        setIsOpen(false)
        setData(null)
    }, [])

    const toggle = React.useCallback(() => {
        setIsOpen((prev) => {
            if (prev) setData(null)
            return !prev
        })
    }, [])

    return {isOpen, open, close, toggle, data}
}
