import * as React from 'react'
import {cn} from '@workspace/ui/lib/utils'
import {Inbox} from 'lucide-react'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode
    title?: string
    description?: string
    action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({icon, title = 'No data yet', description, action, className, children, ...props}, ref) => (
        <div
            ref={ref}
            className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
            {...props}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                {icon ?? <Inbox className="h-6 w-6 text-muted-foreground"/>}
            </div>
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
            {children}
        </div>
    ),
)
EmptyState.displayName = 'EmptyState'

export {EmptyState}
