'use client'

import * as React from 'react'
import {cn} from '@/lib/utils'
import {X} from 'lucide-react'
import type {NotificationData, NotificationPosition} from './types'

export interface NotificationItemProps {
    notification?: Partial<NotificationData>
    title?: string
    description?: string
    time?: string
    avatar?: string
    avatarAlt?: string
    position?: NotificationPosition
    onDismiss?: (dir?: 'left' | 'right' | 'default') => void
    actionLabel?: string
    onAction?: () => void
    className?: string
    isDismissing?: boolean
    /** Whether to show a close button on hover */
    showCloseButton?: boolean
    /** Enable swipe to clear gesture */
    enableSwipe?: boolean
}

export function NotificationItem({
    notification,
    title = notification?.title ?? 'Gym Chad',
    description = notification?.description ?? '6 months ago you said tomorrow. Still in couch?',
    time = notification?.time ?? '30d',
    avatar = notification?.avatar ?? '/chad.jpg',
    avatarAlt = notification?.avatarAlt ?? '',
    position = notification?.position ?? 'top-right',
    onDismiss = notification?.onDismiss,
    actionLabel = notification?.actionLabel,
    onAction = notification?.onAction,
    className,
    isDismissing = false,
    showCloseButton = true,
    enableSwipe = true,
}: NotificationItemProps) {
    const [imgSrc, setImgSrc] = React.useState(avatar)
    const [imgError, setImgError] = React.useState(false)
    const [dismissing, setDismissing] = React.useState(isDismissing || !!notification?.isDismissing)
    const [dismissExitDir, setDismissExitDir] = React.useState<'left' | 'right' | 'default'>(notification?.dismissDir || 'default')

    // Keep imgSrc in sync when avatar changes
    React.useEffect(() => {
        setImgSrc(avatar)
        setImgError(false)
    }, [avatar])

    // Swipe-to-dismiss gesture state
    const [dragX, setDragX] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const startXRef = React.useRef(0)
    const dragThreshold = 65 // pixels threshold to trigger dismiss

    // Synchronize parent isDismissing
    React.useEffect(() => {
        if (isDismissing || notification?.isDismissing) {
            setDismissing(true)
            if (notification?.dismissDir) {
                setDismissExitDir(notification.dismissDir)
            }
        }
    }, [isDismissing, notification?.isDismissing, notification?.dismissDir])

    // Position-based entrance animation classes
    const entranceAnimation = React.useMemo(() => {
        switch (position) {
            case 'top-left':
                return 'animate-in fade-in-0 slide-in-from-top-6 slide-in-from-left-6 duration-300 ease-out'
            case 'top-right':
                return 'animate-in fade-in-0 slide-in-from-top-6 slide-in-from-right-6 duration-300 ease-out'
            case 'bottom-left':
                return 'animate-in fade-in-0 slide-in-from-bottom-6 slide-in-from-left-6 duration-300 ease-out'
            case 'bottom-right':
            default:
                return 'animate-in fade-in-0 slide-in-from-bottom-6 slide-in-from-right-6 duration-300 ease-out'
        }
    }, [position])

    // Position & swipe aware fade-out + slide-out animation classes
    const exitAnimation = React.useMemo(() => {
        if (dismissExitDir === 'left') {
            return '-translate-x-[130%] opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
        }
        if (dismissExitDir === 'right') {
            return 'translate-x-[130%] opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
        }

        switch (position) {
            case 'top-left':
                return '-translate-x-[130%] -translate-y-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
            case 'top-right':
                return 'translate-x-[130%] -translate-y-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
            case 'bottom-left':
                return '-translate-x-[130%] translate-y-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
            case 'bottom-right':
            default:
                return 'translate-x-[130%] translate-y-4 opacity-0 scale-90 pointer-events-none transition-all duration-300 ease-in'
        }
    }, [position, dismissExitDir])

    const handleClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        const dir = position.includes('left') ? 'left' : 'right'
        setDismissExitDir(dir)
        setDismissing(true)
        setTimeout(() => {
            onDismiss?.(dir)
        }, 300)
    }

    // Pointer gesture handlers for instant swipe-to-dismiss
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!enableSwipe || dismissing) return
        if (e.button !== 0) return // Only primary click/touch
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('a')) return

        startXRef.current = e.clientX
        setIsDragging(true)
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || dismissing) return
        const currentDelta = e.clientX - startXRef.current
        setDragX(currentDelta)
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return
        setIsDragging(false)
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}

        if (Math.abs(dragX) > dragThreshold) {
            // Dismissed by swipe with immediate fade-out!
            const dir = dragX > 0 ? 'right' : 'left'
            setDismissExitDir(dir)
            setDismissing(true)
            setTimeout(() => {
                onDismiss?.(dir)
            }, 300)
        } else {
            // Spring snap back
            setDragX(0)
        }
    }

    const handlePointerCancel = () => {
        if (isDragging) {
            setIsDragging(false)
            setDragX(0)
        }
    }

    // Dynamic drag styles with smooth opacity fade
    const dragStyle: React.CSSProperties = isDragging
        ? {
              transform: `translateX(${dragX}px)`,
              opacity: Math.max(0.1, 1 - Math.abs(dragX) / 200),
              transition: 'none',
              cursor: 'grabbing',
          }
        : dragX !== 0 && !dismissing
        ? {
              transform: 'translateX(0px)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          }
        : {}

    const handleImageError = () => {
        if (imgSrc !== '/chad.jpg') {
            setImgSrc('/chad.jpg')
        } else {
            setImgError(true)
        }
    }

    return (
        <div
            role="alert"
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={dragStyle}
            className={cn(
                'group relative flex items-center gap-3 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-[18px] bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 p-3 sm:p-3.5 shadow-xl shadow-black/8 dark:shadow-black/50 select-none touch-pan-y',
                enableSwipe && 'cursor-grab active:cursor-grabbing hover:border-gray-300 dark:hover:border-zinc-700',
                !dismissing && !isDragging && entranceAnimation,
                dismissing && exitAnimation,
                className
            )}
        >
            {/* 1. EXACT Avatar / Icon Structure */}
            <div className="shrink-0 relative pointer-events-none">
                {!imgError ? (
                    <img
                        alt={avatarAlt}
                        loading="lazy"
                        width={100}
                        height={100}
                        decoding="async"
                        data-nimg="1"
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-[12px] bg-muted/20"
                        style={{color: 'transparent'}}
                        srcSet={`${imgSrc} 1x, ${imgSrc} 2x`}
                        src={imgSrc}
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs">
                        💪
                    </div>
                )}
            </div>

            {/* 2. EXACT Content Structure */}
            <div className="w-full min-w-0 pr-1 pointer-events-none">
                <div className="font-semibold text-gray-950 dark:text-white text-xs sm:text-sm tracking-tight truncate">
                    {title}
                </div>
                <div className="font-normal text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs leading-tight line-clamp-2 mt-0.5">
                    {description}
                </div>
                {actionLabel && onAction && (
                    <div className="pt-1.5 sm:pt-2 pointer-events-auto">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onAction()
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            {actionLabel}
                        </button>
                    </div>
                )}
            </div>

            {/* 3. EXACT Timestamp Structure */}
            <div className="shrink-0 self-start pt-0.5 pointer-events-none">
                <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs font-normal whitespace-nowrap">
                    {time}
                </p>
            </div>

            {/* Dismiss Close Icon (Appears on Hover) */}
            {showCloseButton && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-zinc-700 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 pointer-events-auto"
                    aria-label="Dismiss notification"
                    title="Dismiss"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    )
}
