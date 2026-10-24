import * as React from 'react'
import {cn} from '@workspace/ui/lib/utils'
import {Skeleton} from '@workspace/ui/ui/skeleton'

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Predefined layout: 'card', 'list', 'profile', 'table' */
    variant?: 'card' | 'list' | 'profile' | 'table'
    /** Number of rows for list/table variants */
    rows?: number
}

function CardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-5 w-2/5"/>
                <Skeleton className="h-4 w-4/5"/>
            </div>
            <Skeleton className="h-24 w-full"/>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-20"/>
                <Skeleton className="h-9 w-20"/>
            </div>
        </div>
    )
}

function ListSkeleton({rows = 3}: {rows?: number}) {
    return (
        <div className="space-y-3">
            {Array.from({length: rows}).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md border">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0"/>
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/5"/>
                        <Skeleton className="h-3 w-2/5"/>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ProfileSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <Skeleton className="h-20 w-20 rounded-full"/>
            <div className="space-y-2 text-center">
                <Skeleton className="h-5 w-32 mx-auto"/>
                <Skeleton className="h-4 w-48 mx-auto"/>
            </div>
            <div className="w-full max-w-sm space-y-3 mt-2">
                <Skeleton className="h-9 w-full"/>
                <Skeleton className="h-9 w-full"/>
            </div>
        </div>
    )
}

function TableSkeleton({rows = 3}: {rows?: number}) {
    return (
        <div className="rounded-md border">
            <div className="border-b px-4 py-3 flex gap-4">
                <Skeleton className="h-4 w-24"/>
                <Skeleton className="h-4 w-32"/>
                <Skeleton className="h-4 w-20 ml-auto"/>
            </div>
            {Array.from({length: rows}).map((_, i) => (
                <div key={i} className="border-b last:border-0 px-4 py-3 flex gap-4">
                    <Skeleton className="h-4 w-24"/>
                    <Skeleton className="h-4 w-32"/>
                    <Skeleton className="h-4 w-16 ml-auto"/>
                </div>
            ))}
        </div>
    )
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
    ({variant = 'list', rows = 3, className, ...props}, ref) => (
        <div ref={ref} className={cn('w-full', className)} {...props}>
            {variant === 'card' && <CardSkeleton/>}
            {variant === 'list' && <ListSkeleton rows={rows}/>}
            {variant === 'profile' && <ProfileSkeleton/>}
            {variant === 'table' && <TableSkeleton rows={rows}/>}
        </div>
    ),
)
LoadingState.displayName = 'LoadingState'

export {LoadingState}
