'use client'

import type {LucideIcon} from 'lucide-react'
import {Card, CardContent} from '@workspace/ui/ui/card'
import {cn} from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    trend?: { value: number; label: string }
    className?: string
}

export function StatCard({title, value, subtitle, icon: Icon, trend, className}: StatCardProps) {
    return (
        <Card className={cn('animate-fade-in', className)}>
            <CardContent className="pt-6 sm:pt-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trend && (
                            <p className={cn(
                                'text-xs font-medium',
                                trend.value > 0 ? 'text-success' :
                                    trend.value < 0 ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                                {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
                            </p>
                        )}
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2.5">
                        <Icon className="h-5 w-5 text-primary"/>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
