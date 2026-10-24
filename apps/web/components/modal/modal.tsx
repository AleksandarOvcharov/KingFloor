'use client'

import * as React from 'react'
import {cva, type VariantProps} from 'class-variance-authority'
import {X} from 'lucide-react'
import {cn} from '@/lib/utils'

// ---------------------------------------------------------------------------
// Modal Variants
// ---------------------------------------------------------------------------

const modalVariants = cva(
    'relative bg-background border shadow-xl rounded-xl outline-none max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)]',
    {
        variants: {
            size: {
                sm: 'max-w-sm',
                md: 'max-w-md',
                lg: 'max-w-lg',
                xl: 'max-w-xl',
                full: 'w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-w-none',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModalProps extends VariantProps<typeof modalVariants> {
    /** Whether the modal is open */
    open: boolean
    /** Called when the modal should close */
    onClose: () => void
    /** Modal content */
    children: React.ReactNode
    /** Additional className for the modal panel */
    className?: string
    /** Close on overlay click (default: true) */
    closeOnOverlayClick?: boolean
    /** Close on Escape key (default: true) */
    closeOnEscape?: boolean
    /** Show the close button (default: true) */
    showCloseButton?: boolean
    /** Vertical position (default: center) */
    position?: 'center' | 'top'
}

// ---------------------------------------------------------------------------
// Modal Component
// ---------------------------------------------------------------------------

function Modal({
                   open,
                   onClose,
                   children,
                   className,
                   size,
                   position = 'center',
                   closeOnOverlayClick = true,
                   closeOnEscape = true,
                   showCloseButton = true,
               }: ModalProps) {
    const [mounted, setMounted] = React.useState(false)
    const [visible, setVisible] = React.useState(false)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const previousFocusRef = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Animate in: set visible on next frame after open becomes true
    React.useEffect(() => {
        if (open) {
            previousFocusRef.current = document.activeElement as HTMLElement
            document.body.style.overflow = 'hidden'
            // Delay so the initial (invisible) render happens, then transition triggers
            const raf = requestAnimationFrame(() => {
                setVisible(true)
                panelRef.current?.focus()
            })
            return () => cancelAnimationFrame(raf)
        } else {
            setVisible(false)
            document.body.style.overflow = ''
        }
    }, [open])

    // Escape key handler
    React.useEffect(() => {
        if (!open || !closeOnEscape) return

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, closeOnEscape, onClose])

    // Restore focus when fully closed
    React.useEffect(() => {
        if (!open) {
            previousFocusRef.current?.focus()
        }
    }, [open])

    function handleOverlayClick(e: React.MouseEvent) {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!mounted || !open) return null

    return (
        <div className="modal-root">
            {/* Overlay */}
            <div
                className={cn(
                    'fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ease-out',
                    visible ? 'opacity-100 backdrop-blur-xs' : 'opacity-0'
                )}
                aria-hidden="true"
            />

            {/* Centering container */}
            <div
                className={cn(
                    'fixed inset-0 z-50 flex justify-center overflow-y-auto p-3 sm:p-4',
                    position === 'center' ? 'items-center' : 'items-start pt-16 sm:pt-20'
                )}
                onClick={handleOverlayClick}
            >
                {/* Panel */}
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    tabIndex={-1}
                    className={cn(
                        modalVariants({size}),
                        'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
                        visible
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95',
                        className
                    )}
                >
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    )
}

Modal.displayName = 'Modal'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ModalHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn('px-4 sm:px-6 pt-4 sm:pt-6 pb-2 space-y-1.5', className)}
        {...props}
    />
))
ModalHeader.displayName = 'ModalHeader'

const ModalTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({className, ...props}, ref) => (
    <h2
        ref={ref}
        className={cn('text-base sm:text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
))
ModalTitle.displayName = 'ModalTitle'

const ModalDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({className, ...props}, ref) => (
    <p
        ref={ref}
        className={cn('text-xs sm:text-sm text-muted-foreground', className)}
        {...props}
    />
))
ModalDescription.displayName = 'ModalDescription'

const ModalBody = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn('px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm', className)}
        {...props}
    />
))
ModalBody.displayName = 'ModalBody'

const ModalFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn(
            'px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
            className
        )}
        {...props}
    />
))
ModalFooter.displayName = 'ModalFooter'

export {
    Modal,
    ModalHeader,
    ModalTitle,
    ModalDescription,
    ModalBody,
    ModalFooter,
    modalVariants,
}
