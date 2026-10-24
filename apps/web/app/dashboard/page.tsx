'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {useProfile} from '@/hooks/useProfile'
import {useAnalytics} from '@/hooks/useAnalytics'
import {Header} from '@/components/header'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {Badge} from '@workspace/ui/ui/badge'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@workspace/ui/ui/tabs'
import {Progress} from '@workspace/ui/ui/progress'
import {Separator} from '@workspace/ui/ui/separator'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@workspace/ui/ui/tooltip'
import {StatCard} from '@/components/dashboard/stat-card'
import {ActivityChart} from '@/components/dashboard/activity-chart'
import {ActivityFeed} from '@/components/dashboard/activity-feed'
import {OverviewChart} from '@/components/dashboard/overview-chart'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {
    Activity,
    BarChart3,
    Bot,
    Calendar,
    CheckCircle2,
    MessageSquare,
    RefreshCw,
    Send,
    Settings,
    UserRound,
    XCircle,
} from 'lucide-react'

function DashboardSkeleton() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full"/>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48"/>
                    <Skeleton className="h-4 w-32"/>
                </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 4}).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6 sm:pt-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-20"/>
                                <Skeleton className="h-8 w-16"/>
                                <Skeleton className="h-3 w-24"/>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <Skeleton className="h-[340px] lg:col-span-2 rounded-xl"/>
                <Skeleton className="h-[340px] rounded-xl"/>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const {user, loading} = useAuth()
    const {profile, loading: profileLoading} = useProfile(user)
    const {stats, trackEvent, refreshStats, loading: statsLoading} = useAnalytics(user)
    const {t, locale} = useI18n()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !loading && !user) {
            router.push('/')
        }
    }, [user, loading, router, mounted])

    useEffect(() => {
        if (user) {
            trackEvent('page_view', {page: '/dashboard'})
        }
    }, [user, trackEvent])

    if (!mounted || loading || (user && profileLoading)) {
        return (
            <main className="min-h-screen">
                <Header/>
                <div className="container mx-auto px-4 py-8 sm:py-16">
                    <DashboardSkeleton/>
                </div>
            </main>
        )
    }

    if (!user) {
        return null
    }

    const displayUsername = profile?.username || user?.email?.split('@')[0] || 'User'
    const initials = displayUsername.substring(0, 2).toUpperCase()
    const memberSince = (profile?.created_at || user?.created_at)
        ? new Date(profile?.created_at ?? user!.created_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US', {month: 'long', year: 'numeric'})
        : t.dashboard.notAvailable
    const authProvider = user?.app_metadata?.provider || 'email'

    // Profile completeness
    const completionSteps = [
        {label: t.dashboard.stepUsernameSet, done: !!profile?.username},
        {label: t.dashboard.stepEmailVerified, done: !!user?.email_confirmed_at},
        {label: t.dashboard.stepAvatarUploaded, done: !!profile?.avatar_url},
        {label: t.dashboard.stepBioWritten, done: !!profile?.bio},
    ]
    const completedCount = completionSteps.filter(s => s.done).length
    const completionPercent = Math.round((completedCount / completionSteps.length) * 100)

    const isLoading = loading || statsLoading

    return (
        <TooltipProvider>
            <main className="min-h-screen">
                <Header/>

                <div className="container mx-auto px-4 py-8 sm:py-16">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* Profile Header */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayUsername}/>
                                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold tracking-tight">
                                            {tFormat(t.dashboard.welcomeBack, {name: displayUsername})}
                                        </h1>
                                        <Badge variant={authProvider === 'google' ? 'default' : 'secondary'}>
                                            {authProvider === 'google' ? 'Google' : authProvider === 'github' ? 'GitHub' : t.auth.email}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Calendar className="h-3 w-3"/>
                      {tFormat(t.dashboard.joined, {date: memberSince})}
                    </span>
                                        <span className="flex items-center gap-1">
                      {user?.email_confirmed_at ? (
                          <CheckCircle2 className="h-3 w-3 text-success"/>
                      ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground"/>
                      )}
                                            {user?.email_confirmed_at ? t.status.verified : t.status.unverified}
                    </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={refreshStats}
                                            disabled={statsLoading}
                                        >
                                            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`}/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t.dashboard.refreshStats}</TooltipContent>
                                </Tooltip>
                                {profile?.is_public && profile?.username && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" asChild>
                                                <Link href={`/users/${profile.username}`} target="_blank">
                                                    <UserRound className="h-4 w-4"/>
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t.dashboard.viewPublicProfile}</TooltipContent>
                                    </Tooltip>
                                )}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" asChild>
                                            <Link href="/settings">
                                                <Settings className="h-4 w-4"/>
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t.common.settings}</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title={t.dashboard.statConversations}
                                value={isLoading ? '—' : stats?.totalConversations ?? 0}
                                icon={MessageSquare}
                                subtitle={t.dashboard.statConversationsSubtitle}
                            />
                            <StatCard
                                title={t.dashboard.statMessagesSent}
                                value={isLoading ? '—' : stats?.userMessages ?? 0}
                                icon={Send}
                                subtitle={t.dashboard.statMessagesSentSubtitle}
                            />
                            <StatCard
                                title={t.dashboard.statAiResponses}
                                value={isLoading ? '—' : stats?.modelMessages ?? 0}
                                icon={Bot}
                                subtitle={t.dashboard.statAiResponsesSubtitle}
                            />
                            <StatCard
                                title={t.dashboard.statTotalActivity}
                                value={isLoading ? '—' : stats?.recentEvents?.length ?? 0}
                                icon={Activity}
                                subtitle={t.dashboard.statTotalActivitySubtitle}
                            />
                        </div>

                        {/* Tabbed Content */}
                        <Tabs defaultValue="analytics" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="analytics">{t.dashboard.tabAnalytics}</TabsTrigger>
                                <TabsTrigger value="activity">{t.dashboard.tabActivity}</TabsTrigger>
                                <TabsTrigger value="account">{t.dashboard.tabAccount}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="analytics" className="space-y-6">
                                <div className="grid lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <ActivityChart data={stats?.dailyMessages || []}/>
                                    </div>
                                    <OverviewChart
                                        userMessages={stats?.userMessages ?? 0}
                                        modelMessages={stats?.modelMessages ?? 0}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="activity">
                                <ActivityFeed events={stats?.recentEvents || []}/>
                            </TabsContent>

                            <TabsContent value="account" className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Profile Completeness */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle>{t.dashboard.profileCompleteness}</CardTitle>
                                                <span className="text-sm font-semibold">{completionPercent}%</span>
                                            </div>
                                            <CardDescription>{t.dashboard.profileCompletenessDescription}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Progress value={completionPercent} className="h-2"/>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {completionSteps.map((step) => (
                                                    <div key={step.label} className="flex items-center gap-2">
                                                        {step.done ? (
                                                            <CheckCircle2 className="h-4 w-4 text-success shrink-0"/>
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-muted-foreground shrink-0"/>
                                                        )}
                                                        <span
                                                            className={step.done ? '' : 'text-muted-foreground'}>{step.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {completionPercent < 100 && (
                                                <>
                                                    <Separator/>
                                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                                        <Link href="/settings">
                                                            {t.dashboard.completeProfile}
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Account Details */}
                                    <Card className="animate-fade-in">
                                        <CardHeader>
                                            <CardTitle>{t.dashboard.accountDetails}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{t.auth.email}</span>
                                                <span className="text-sm font-medium">{user?.email}</span>
                                            </div>
                                            <Separator/>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{t.dashboard.username}</span>
                                                <span
                                                    className="text-sm font-medium">{profile?.username || t.dashboard.notSet}</span>
                                            </div>
                                            <Separator/>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{t.dashboard.verified}</span>
                                                <Badge variant={user?.email_confirmed_at ? 'default' : 'outline'}
                                                       className="text-xs">
                                                    {user?.email_confirmed_at ? t.dashboard.yes : t.dashboard.no}
                                                </Badge>
                                            </div>
                                            <Separator/>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">{t.dashboard.userId}</span>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                            <span
                                className="text-xs font-mono text-muted-foreground truncate ml-4 max-w-[160px] cursor-help">
                              {user?.id}
                            </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left" className="font-mono text-xs">
                                                        {user?.id}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Quick Actions */}
                                <Card className="animate-fade-in">
                                    <CardHeader>
                                        <CardTitle>{t.dashboard.quickActions}</CardTitle>
                                        <CardDescription>{t.dashboard.quickActionsDescription}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                                            <Link href="/ai">
                                                <Bot className="mr-2 h-4 w-4 text-primary"/>
                                                <span className="text-sm">{t.dashboard.aiChat}</span>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                                            <Link href="/settings">
                                                <Settings className="mr-2 h-4 w-4 text-primary"/>
                                                <span className="text-sm">{t.common.settings}</span>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                                            <Link href="/features">
                                                <BarChart3 className="mr-2 h-4 w-4 text-primary"/>
                                                <span className="text-sm">{t.nav.features}</span>
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                                            <Link href="/about">
                                                <Activity className="mr-2 h-4 w-4 text-primary"/>
                                                <span className="text-sm">{t.nav.about}</span>
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                    </div>
                </div>
            </main>
        </TooltipProvider>
    )
}
