'use client'

import * as React from 'react'
import {cva, type VariantProps} from 'class-variance-authority'
import {cn} from '@workspace/ui/lib/utils'
import {Bell, Check, X} from 'lucide-react'

const notificationVariants = cva(
    'group relative flex w-full items-start gap-3.5 transition-all duration-200 select-none',
    {
        variants: {
            variant: {
                default:
                    'rounded-xl border border-border/60 bg-card/60 backdrop-blur-xs p-3.5 shadow-xs hover:border-border hover:bg-card/90 hover:shadow-sm',
                card:
                    'rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30',
                subtle:
                    'rounded-lg bg-muted/40 p-3 hover:bg-muted/70',
                compact:
                    'rounded-lg border border-border/40 p-2.5 hover:bg-muted/30 text-xs',
                outline:
                    'rounded-xl border-2 border-border bg-transparent p-3.5 hover:border-primary/40 hover:bg-muted/10',
            },
            status: {
                default: '',
                info: 'border-l-4 border-l-sky-500 dark:border-l-sky-400',
                success: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400',
                warning: 'border-l-4 border-l-amber-500 dark:border-l-amber-400',
                error: 'border-l-4 border-l-rose-500 dark:border-l-rose-400',
            },
            unread: {
                true: 'border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.08]',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            status: 'default',
            unread: false,
        },
    }
)

export interface NotificationCardProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
        VariantProps<typeof notificationVariants> {
    /** Avatar image URL or custom React node */
    avatar?: string | React.ReactNode
    /** Alt text if avatar is an image URL */
    avatarAlt?: string
    /** Fallback text if avatar fails or is initials */
    avatarFallback?: string
    /** Avatar shape styling */
    avatarShape?: 'rounded' | 'square' | 'circle'
    /** Notification title or sender name (e.g. "Gym Chad") */
    title?: React.ReactNode
    /** Notification body description (e.g. "6 months ago you said tomorrow. Still in couch?") */
    description?: React.ReactNode
    /** Timestamp string (e.g. "30d", "2m ago", "Just now") */
    timestamp?: string
    /** Whether the notification is unread (displays badge dot & highlight) */
    unread?: boolean
    /** Callback when user clicks the dismiss button */
    onDismiss?: () => void
    /** Callback when user toggles read/unread */
    onReadToggle?: () => void
    /** Custom actions element (e.g. buttons) */
    actions?: React.ReactNode
    /** Whether the dismiss button is shown */
    dismissible?: boolean
}

const NotificationCard = React.forwardRef<HTMLDivElement, NotificationCardProps>(
    (
        {
            className,
            variant,
            status,
            unread = false,
            avatar,
            avatarAlt,
            avatarFallback,
            avatarShape = 'rounded',
            title,
            description,
            timestamp,
            onDismiss,
            onReadToggle,
            actions,
            dismissible = true,
            children,
            onClick,
            ...props
        },
        ref
    ) => {
        const [isDismissing, setIsDismissing] = React.useState(false)
        const [imgError, setImgError] = React.useState(false)

        const handleDismiss = (e: React.MouseEvent) => {
            e.stopPropagation()
            setIsDismissing(true)
            setTimeout(() => {
                onDismiss?.()
            }, 180)
        }

        const isImageAvatar = typeof avatar === 'string'

        const shapeClass =
            avatarShape === 'circle'
                ? 'rounded-full'
                : avatarShape === 'square'
                ? 'rounded-none'
                : 'rounded-[12px]'

        // Compound mode fallback if children provided directly
        if (children) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        notificationVariants({variant, status, unread}),
                        isDismissing && 'scale-95 opacity-0 transition-all duration-200 ease-out',
                        className
                    )}
                    onClick={onClick}
                    role="alert"
                    {...props}
                >
                    {children}
                </div>
            )
        }

        return (
            <div
                ref={ref}
                className={cn(
                    notificationVariants({variant, status, unread}),
                    isDismissing && 'scale-95 opacity-0 transition-all duration-200 ease-out',
                    className
                )}
                onClick={onClick}
                role="alert"
                {...props}
            >
                {/* Avatar / Icon Slot */}
                {(avatar || avatarFallback) && (
                    <div className="relative shrink-0 select-none">
                        {isImageAvatar && !imgError ? (
                            <img
                                alt={avatarAlt || (typeof title === 'string' ? title : 'Notification avatar')}
                                loading="lazy"
                                width={48}
                                height={48}
                                decoding="async"
                                onError={() => setImgError(true)}
                                className={cn(
                                    'h-12 w-12 object-contain bg-muted/30 shadow-xs border border-border/40',
                                    variant === 'compact' && 'h-9 w-9',
                                    shapeClass
                                )}
                                src={avatar as string}
                            />
                        ) : avatarFallback ? (
                            <div
                                className={cn(
                                    'flex h-12 w-12 items-center justify-center bg-muted text-sm font-semibold text-muted-foreground border border-border/40 shadow-xs',
                                    variant === 'compact' && 'h-9 w-9 text-xs',
                                    shapeClass
                                )}
                            >
                                {avatarFallback}
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    'flex h-12 w-12 items-center justify-center bg-primary/10 text-primary',
                                    variant === 'compact' && 'h-9 w-9',
                                    shapeClass
                                )}
                            >
                                {avatar}
                            </div>
                        )}

                        {/* Unread Dot Badge */}
                        {unread && (
                            <span
                                className="absolute -top-1 -right-1 flex h-3.5 w-3.5"
                                title="Unread"
                            >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background" />
                            </span>
                        )}
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        {title && (
                            <div className="font-semibold text-foreground leading-snug tracking-tight truncate">
                                {title}
                            </div>
                        )}
                        {timestamp && (
                            <p className="text-xs font-normal text-muted-foreground shrink-0 whitespace-nowrap pt-0.5">
                                {timestamp}
                            </p>
                        )}
                    </div>

                    {description && (
                        <div className="text-sm font-normal text-muted-foreground leading-tight line-clamp-3 group-hover:text-foreground/90 transition-colors">
                            {description}
                        </div>
                    )}

                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            {actions}
                        </div>
                    )}
                </div>

                {/* Dismiss & Read Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 sm:group-hover:opacity-100 transition-opacity">
                    {onReadToggle && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onReadToggle()
                            }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            aria-label={unread ? 'Mark as read' : 'Mark as unread'}
                            title={unread ? 'Mark as read' : 'Mark as unread'}
                        >
                            <Check className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {dismissible && onDismiss && (
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            aria-label="Dismiss notification"
                            title="Dismiss"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        )
    }
)
NotificationCard.displayName = 'NotificationCard'

// Compound Components for Custom Composition

const NotificationAvatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        src?: string
        alt?: string
        fallback?: string
        shape?: 'rounded' | 'square' | 'circle'
        unread?: boolean
    }
>(({className, src, alt = '', fallback, shape = 'rounded', unread = false, children, ...props}, ref) => {
    const [imgError, setImgError] = React.useState(false)
    const shapeClass =
        shape === 'circle'
            ? 'rounded-full'
            : shape === 'square'
            ? 'rounded-none'
            : 'rounded-[12px]'

    return (
        <div ref={ref} className={cn('relative shrink-0', className)} {...props}>
            {src && !imgError ? (
                <img
                    alt={alt}
                    loading="lazy"
                    width={48}
                    height={48}
                    decoding="async"
                    onError={() => setImgError(true)}
                    className={cn('h-12 w-12 object-cover', shapeClass)}
                    src={src}
                />
            ) : fallback ? (
                <div
                    className={cn(
                        'flex h-12 w-12 items-center justify-center bg-muted text-sm font-semibold text-muted-foreground',
                        shapeClass
                    )}
                >
                    {fallback}
                </div>
            ) : (
                <div
                    className={cn(
                        'flex h-12 w-12 items-center justify-center bg-primary/10 text-primary',
                        shapeClass
                    )}
                >
                    {children || <Bell className="h-5 w-5" />}
                </div>
            )}

            {unread && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-background" />
                </span>
            )}
        </div>
    )
})
NotificationAvatar.displayName = 'NotificationAvatar'

const NotificationContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div ref={ref} className={cn('flex-1 min-w-0 space-y-1', className)} {...props} />
))
NotificationContent.displayName = 'NotificationContent'

const NotificationHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn('flex items-start justify-between gap-2', className)}
        {...props}
    />
))
NotificationHeader.displayName = 'NotificationHeader'

const NotificationTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({className, ...props}, ref) => (
    <div
        ref={ref}
        className={cn('font-semibold text-foreground leading-snug tracking-tight truncate', className)}
        {...props}
    />
))
NotificationTitle.displayName = 'NotificationTitle'

const NotificationDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({className, ...props}, ref) => (
    <p
        ref={ref}
        className={cn('text-sm font-normal text-muted-foreground leading-tight', className)}
        {...props}
    />
))
NotificationDescription.displayName = 'NotificationDescription'

const NotificationTimestamp = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({className, ...props}, ref) => (
    <p
        ref={ref}
        className={cn('text-xs font-normal text-muted-foreground shrink-0 whitespace-nowrap pt-0.5', className)}
        {...props}
    />
))
NotificationTimestamp.displayName = 'NotificationTimestamp'

const NotificationDot = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & {pulse?: boolean}
>(({className, pulse = true, ...props}, ref) => (
    <span
        ref={ref}
        className={cn('relative flex h-2.5 w-2.5 shrink-0', className)}
        {...props}
    >
        {pulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        )}
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
    </span>
))
NotificationDot.displayName = 'NotificationDot'

const NotificationActions = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
    <div ref={ref} className={cn('flex flex-wrap items-center gap-2 pt-2', className)} {...props} />
))
NotificationActions.displayName = 'NotificationActions'

export interface NotificationListProps extends React.HTMLAttributes<HTMLDivElement> {
    emptyMessage?: string
    emptyIcon?: React.ReactNode
    maxHeight?: number | string
}

const NotificationList = React.forwardRef<HTMLDivElement, NotificationListProps>(
    ({className, emptyMessage = 'No notifications yet.', emptyIcon, maxHeight, style, children, ...props}, ref) => {
        const hasChildren = React.Children.count(children) > 0

        const computedStyle: React.CSSProperties = {
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            ...style,
        }

        return (
            <div
                ref={ref}
                data-lenis-prevent
                style={computedStyle}
                className={cn('flex flex-col gap-2.5 overflow-y-auto', className)}
                role="region"
                aria-label="Notifications list"
                {...props}
            >
                {hasChildren ? (
                    children
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-muted/20 border-dashed">
                        {emptyIcon || <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />}
                        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
                    </div>
                )}
            </div>
        )
    }
)
NotificationList.displayName = 'NotificationList'

export {
    NotificationCard,
    NotificationCard as NotificationItem,
    NotificationAvatar,
    NotificationContent,
    NotificationHeader,
    NotificationTitle,
    NotificationDescription,
    NotificationTimestamp,
    NotificationDot,
    NotificationActions,
    NotificationList,
    notificationVariants,
}
