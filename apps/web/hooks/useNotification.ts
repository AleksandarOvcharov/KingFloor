'use client'

import * as React from 'react'
import {NotificationContext} from '@/components/notification/notification-provider'
import type {NotificationContextType} from '@/components/notification/types'

export function useNotification(): NotificationContextType {
    const context = React.useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a <NotificationProvider>')
    }
    return context
}
