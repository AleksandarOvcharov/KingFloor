'use client'

import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,} from 'recharts'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {useI18n} from '@/lib/i18n/provider'

interface OverviewChartProps {
    userMessages: number
    modelMessages: number
}

export function OverviewChart({userMessages, modelMessages}: OverviewChartProps) {
    const {t} = useI18n()
    const total = userMessages + modelMessages
    const data = [
        {name: t.activity.you, value: userMessages},
        {name: 'AI', value: modelMessages},
    ]

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))']

    return (
        <Card className="animate-fade-in">
            <CardHeader>
                <CardTitle>{t.activity.messageBreakdown}</CardTitle>
                <CardDescription>{t.activity.messageBreakdownDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                        {t.activity.noMessagesYet}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]}/>
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
