'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useAuth} from '@/hooks/useAuth'
import {BuildingProvider, useBuildingContext} from '@/hooks/building/BuildingContext'
import {Header} from '@/components/header'
import {Badge} from '@workspace/ui/ui/badge'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Alert, AlertDescription} from '@workspace/ui/ui/alert'
import {Button} from '@workspace/ui/ui/button'
import {copyToClipboard} from '@/lib/copy-to-clipboard'
import {cn} from '@/lib/utils'
import {useI18n} from '@/lib/i18n/provider'
import {Building2, Check, Coins, Copy, FileText, LayoutDashboard, Megaphone, MessageCircle, Settings, Vote, Wrench} from 'lucide-react'

function InviteCode({code}: {code: string}) {
    const {t} = useI18n()
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        const ok = await copyToClipboard(code)
        if (ok) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="mt-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.building.inviteCodeLabel}</p>
            <button
                onClick={handleCopy}
                className="mt-0.5 flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-xs font-mono tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                title={t.building.inviteCodeHint}
                aria-label={copied ? t.building.codeCopied : t.building.copyCode}
            >
                {code}
                {copied ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}
            </button>
        </div>
    )
}

export default function BuildingLayout({children}: {children: React.ReactNode}) {
    return (
        <BuildingProvider>
            <BuildingLayoutInner>{children}</BuildingLayoutInner>
        </BuildingProvider>
    )
}

function BuildingLayoutInner({children}: {children: React.ReactNode}) {
    const {user, loading: authLoading} = useAuth()
    const {membership, loading: buildingLoading, error, refetch} = useBuildingContext()
    const {t} = useI18n()
    const pathname = usePathname()
    const router = useRouter()

    const loading = authLoading || buildingLoading
    const isSetupPage = pathname === '/building/setup'

    useEffect(() => {
        if (!authLoading && !user) router.push('/login')
    }, [authLoading, user, router])

    // Only send a member-less user to setup once we're sure the fetch actually
    // succeeded with "no building" — an error (e.g. a dropped request) must
    // never be treated as "no building", or a retry could create a duplicate.
    useEffect(() => {
        if (!loading && user && !membership && !error && !isSetupPage) router.push('/building/setup')
    }, [loading, user, membership, error, isSetupPage, router])

    if (!user || loading) {
        return (
            <main className="min-h-screen">
                <Header/>
                <div className="container mx-auto px-4 py-8 sm:py-16 max-w-6xl space-y-4">
                    <Skeleton className="h-8 w-48"/>
                    <Skeleton className="h-32 w-full rounded-xl"/>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="min-h-screen">
                <Header/>
                <div className="container mx-auto px-4 py-8 sm:py-16 max-w-6xl space-y-4">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button variant="outline" onClick={() => refetch()}>{t.common.retry}</Button>
                </div>
            </main>
        )
    }

    if (!membership) {
        return (
            <main className="min-h-screen">
                <Header/>
                <div className="container mx-auto px-4 py-8 sm:py-16 max-w-6xl">{children}</div>
            </main>
        )
    }

    const navLinks = [
        {href: '/building', label: t.building.navOverview, icon: LayoutDashboard},
        {href: '/building/units', label: t.building.navUnits, icon: Building2},
        {href: '/building/fees', label: t.building.navFees, icon: FileText},
        {href: '/building/expenses', label: t.building.navExpenses, icon: Coins},
        {href: '/building/announcements', label: t.building.navAnnouncements, icon: Megaphone},
        {href: '/building/chat', label: t.building.navChat, icon: MessageCircle},
        {href: '/building/polls', label: t.building.navPolls, icon: Vote},
        {href: '/building/issues', label: t.building.navIssues, icon: Wrench},
        ...(membership.role === 'admin' ? [{href: '/building/settings', label: t.building.navSettings, icon: Settings}] : []),
    ]

    return (
        <div className="min-h-screen bg-muted/30">
            <Header/>
            <div className="flex">
                {/* Desktop sidebar — the <aside> itself has no fixed height, so it
                    stretches to match the content column (the default flex
                    `align-items: stretch`), keeping its background/border for the
                    full length of the page. Only the inner wrapper is sticky, so
                    the nav stays pinned near the top without the whole sidebar
                    disappearing once you scroll past one viewport height. */}
                <aside className="hidden md:flex md:w-60 md:flex-col shrink-0 border-r border-border/80 bg-background">
                    <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-border/60">
                            <p className="font-semibold text-sm leading-snug truncate">{membership.building.name}</p>
                            {membership.building.address && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{membership.building.address}</p>
                            )}
                            <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'} className="mt-2">
                                {membership.role === 'admin' ? t.building.roleAdmin : t.building.roleResident}
                            </Badge>
                            {membership.role === 'admin' && <InviteCode code={membership.building.invite_code}/>}
                        </div>
                        <nav className="flex-1 p-3 space-y-1" aria-label="Building navigation">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0"/>
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </aside>

                <div className="flex-1 min-w-0">
                    {/* Mobile nav */}
                    <div className="md:hidden border-b border-border/80 bg-background px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{membership.building.name}</p>
                            </div>
                            <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'} className="shrink-0">
                                {membership.role === 'admin' ? t.building.roleAdmin : t.building.roleResident}
                            </Badge>
                        </div>
                        <nav className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1" aria-label="Building navigation">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href
                                const Icon = link.icon
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shrink-0 transition-colors',
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-accent',
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5"/>
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</div>
                </div>
            </div>
        </div>
    )
}
