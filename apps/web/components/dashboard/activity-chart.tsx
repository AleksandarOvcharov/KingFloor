'use client'

import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import type {DailyMessageStat} from '@/hooks/useAnalytics'
import {useI18n} from '@/lib/i18n/provider'

interface ActivityChartProps {
    data: DailyMessageStat[]
}

export function ActivityChart({data}: ActivityChartProps) {
    const {t} = useI18n()
    const hasData = data.some(d => d.sent > 0 || d.received > 0)

    return (
        <Card className="animate-fade-in">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">{t.activity.aiUsage}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t.activity.aiUsageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                {!hasData ? (
                    <div className="flex items-center justify-center h-[220px] sm:h-[260px] text-xs sm:text-sm text-muted-foreground p-4 text-center">
                        {t.activity.noChatActivity}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={data} barGap={2} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                            <XAxis
                                dataKey="label"
                                tick={{fontSize: 11}}
                                className="fill-muted-foreground"
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={8}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{fontSize: 11}}
                                className="fill-muted-foreground"
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                labelStyle={{color: 'hsl(var(--foreground))'}}
                            />
                            <Legend
                                wrapperStyle={{fontSize: '11px', paddingTop: '8px'}}
                            />
                            <Bar
                                dataKey="sent"
                                name={t.activity.sent}
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={28}
                            />
                            <Bar
                                dataKey="received"
                                name={t.activity.received}
                                fill="hsl(var(--muted-foreground))"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={28}
                                opacity={0.5}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
