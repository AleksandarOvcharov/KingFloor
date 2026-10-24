export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface NotificationData {
    id: string
    title: string
    description: string
    time?: string
    avatar?: string
    avatarAlt?: string
    position?: NotificationPosition
    duration?: number
    unread?: boolean
    actionLabel?: string
    onAction?: () => void
    onDismiss?: () => void
    isDismissing?: boolean
    dismissDir?: 'left' | 'right' | 'default'
}

export interface NotificationContextType {
    notifications: NotificationData[]
    showNotification: (notification: Omit<NotificationData, 'id' | 'isDismissing' | 'dismissDir'>) => string
    dismissNotification: (id: string, dir?: 'left' | 'right' | 'default') => void
    clearAll: () => void
}
