'use client'

import * as React from 'react'
import {NotificationItem} from './notification-item'
import type {NotificationContextType, NotificationData, NotificationPosition} from './types'

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

let notificationCount = 0

interface NotificationProviderProps {
    children: React.ReactNode
    /** Default corner placement for new notifications */
    defaultPosition?: NotificationPosition
    /** Default duration in ms (0 to keep open until dismissed) */
    defaultDuration?: number
}

export function NotificationProvider({
    children,
    defaultPosition = 'top-right',
    defaultDuration = 4500,
}: NotificationProviderProps) {
    const [notifications, setNotifications] = React.useState<NotificationData[]>([])
    const timeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

    // Clean up all pending timeouts on unmount
    React.useEffect(() => {
        const timeouts = timeoutsRef.current
        return () => {
            timeouts.forEach((timer) => clearTimeout(timer))
            timeouts.clear()
        }
    }, [])

    // Smoothly animated dismissal with full fade-out before unmounting
    const dismissNotification = React.useCallback((id: string, dir: 'left' | 'right' | 'default' = 'default') => {
        // Clear duration auto-dismiss timer if present
        const timer = timeoutsRef.current.get(id)
        if (timer) {
            clearTimeout(timer)
            timeoutsRef.current.delete(id)
        }

        setNotifications((prev) => {
            const target = prev.find((n) => n.id === id)
            if (!target || target.isDismissing) return prev
            // Trigger callback outside updater cycle
            if (target.onDismiss) {
                try {
                    target.onDismiss()
                } catch {}
            }
            return prev.map((n) => (n.id === id ? {...n, isDismissing: true, dismissDir: dir} : n))
        })

        // Wait for fade-out and slide-out animation (320ms) before deleting from DOM
        const cleanupTimer = setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
            timeoutsRef.current.delete(`clean-${id}`)
        }, 320)
        timeoutsRef.current.set(`clean-${id}`, cleanupTimer)
    }, [])

    const clearAll = React.useCallback(() => {
        // Clear all timers
        timeoutsRef.current.forEach((t) => clearTimeout(t))
        timeoutsRef.current.clear()

        // Trigger fade out on all active notifications
        setNotifications((prev) =>
            prev.map((n) => {
                if (n.onDismiss) {
                    try {
                        n.onDismiss()
                    } catch {}
                }
                return {...n, isDismissing: true}
            })
        )
        const cleanupTimer = setTimeout(() => {
            setNotifications([])
        }, 320)
        timeoutsRef.current.set('clear-all', cleanupTimer)
    }, [])

    const showNotification = React.useCallback(
        (data: Omit<NotificationData, 'id' | 'isDismissing' | 'dismissDir'>) => {
            const id = `notif-${++notificationCount}-${Date.now()}`
            const position = data.position || defaultPosition
            const duration = data.duration !== undefined ? data.duration : defaultDuration

            const newNotif: NotificationData = {
                ...data,
                id,
                position,
                isDismissing: false,
                dismissDir: 'default',
            }

            setNotifications((prev) => [...prev, newNotif])

            // Automatically trigger animated fade-out on duration timeout
            if (duration > 0) {
                const autoTimer = setTimeout(() => {
                    dismissNotification(id)
                }, duration)
                timeoutsRef.current.set(id, autoTimer)
            }

            return id
        },
        [defaultPosition, defaultDuration, dismissNotification]
    )

    // Stop wheel event propagation to prevent body / Lenis scrolling when scrolling notifications
    const handleScrollContainerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.stopPropagation()
    }

    const handleScrollContainerTouch = (e: React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation()
    }

    // Group active notifications by position
    const topLeft = notifications.filter((n) => n.position === 'top-left')
    const topRight = notifications.filter((n) => n.position === 'top-right')
    const bottomLeft = notifications.filter((n) => n.position === 'bottom-left')
    const bottomRight = notifications.filter((n) => n.position === 'bottom-right' || !n.position)

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                showNotification,
                dismissNotification,
                clearAll,
            }}
        >
            {children}

            {/* Floating Notification Portals for All 4 Corners (with Scroll & Fade-out) */}

            {/* 1. TOP LEFT */}
            {topLeft.length > 0 && (
                <div
                    data-lenis-prevent
                    onWheel={handleScrollContainerWheel}
                    onTouchMove={handleScrollContainerTouch}
                    className="fixed top-3 left-3 z-50 flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-x-hidden p-1.5 pr-2 focus:outline-none"
                    style={{overscrollBehavior: 'contain'}}
                    aria-live="polite"
                >
                    {topLeft.map((n) => (
                        <div key={n.id} className="pointer-events-auto w-full">
                            <NotificationItem
                                notification={n}
                                position="top-left"
                                isDismissing={n.isDismissing}
                                onDismiss={(dir) => dismissNotification(n.id, dir)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 2. TOP RIGHT */}
            {topRight.length > 0 && (
                <div
                    data-lenis-prevent
                    onWheel={handleScrollContainerWheel}
                    onTouchMove={handleScrollContainerTouch}
                    className="fixed top-3 right-3 z-50 flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-x-hidden p-1.5 pl-2 items-end focus:outline-none"
                    style={{overscrollBehavior: 'contain'}}
                    aria-live="polite"
                >
                    {topRight.map((n) => (
                        <div key={n.id} className="pointer-events-auto w-full">
                            <NotificationItem
                                notification={n}
                                position="top-right"
                                isDismissing={n.isDismissing}
                                onDismiss={(dir) => dismissNotification(n.id, dir)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 3. BOTTOM LEFT (Down Left) */}
            {bottomLeft.length > 0 && (
                <div
                    data-lenis-prevent
                    onWheel={handleScrollContainerWheel}
                    onTouchMove={handleScrollContainerTouch}
                    className="fixed bottom-3 left-3 z-50 flex flex-col-reverse gap-2.5 pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-x-hidden p-1.5 pr-2 focus:outline-none"
                    style={{overscrollBehavior: 'contain'}}
                    aria-live="polite"
                >
                    {bottomLeft.map((n) => (
                        <div key={n.id} className="pointer-events-auto w-full">
                            <NotificationItem
                                notification={n}
                                position="bottom-left"
                                isDismissing={n.isDismissing}
                                onDismiss={(dir) => dismissNotification(n.id, dir)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 4. BOTTOM RIGHT (Down Right) */}
            {bottomRight.length > 0 && (
                <div
                    data-lenis-prevent
                    onWheel={handleScrollContainerWheel}
                    onTouchMove={handleScrollContainerTouch}
                    className="fixed bottom-3 right-3 z-50 flex flex-col-reverse gap-2.5 pointer-events-none max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-x-hidden p-1.5 pl-2 items-end focus:outline-none"
                    style={{overscrollBehavior: 'contain'}}
                    aria-live="polite"
                >
                    {bottomRight.map((n) => (
                        <div key={n.id} className="pointer-events-auto w-full">
                            <NotificationItem
                                notification={n}
                                position="bottom-right"
                                isDismissing={n.isDismissing}
                                onDismiss={(dir) => dismissNotification(n.id, dir)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </NotificationContext.Provider>
    )
}
