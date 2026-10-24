'use client'

import {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import Link from 'next/link'
import {Header} from '@/components/header'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {Badge} from '@workspace/ui/ui/badge'
import {buttonVariants} from '@workspace/ui/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Separator} from '@workspace/ui/ui/separator'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {
    ArrowLeft,
    Calendar,
    EyeOff,
    Github,
    Globe,
    MapPin,
    Twitter,
    UserRound,
} from 'lucide-react'

interface PublicProfile {
    id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    location: string | null
    website: string | null
    twitter_handle: string | null
    github_handle: string | null
    created_at: string
}

type PageState = 'loading' | 'found' | 'not_found' | 'private'

/* ─── Skeleton ────────────────────────────────────────────── */
function ProfileSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Hero */}
            <div className="relative">
                <Skeleton className="h-36 w-full rounded-2xl"/>
                <div className="absolute -bottom-10 left-6">
                    <Skeleton className="h-24 w-24 rounded-full ring-4 ring-background"/>
                </div>
            </div>
            <div className="pt-12 px-2 space-y-3">
                <Skeleton className="h-7 w-48"/>
                <Skeleton className="h-4 w-32"/>
                <Skeleton className="h-4 w-full max-w-sm"/>
                <Skeleton className="h-4 w-3/4 max-w-xs"/>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl"/>)}
            </div>
        </div>
    )
}

/* ─── Empty / Error states ────────────────────────────────── */
function EmptyState({
    icon: Icon,
    title,
    description,
    username,
}: {
    icon: React.ElementType
    title: string
    description: string
    username: string
}) {
    const {t} = useI18n()
    return (
        <div className="max-w-xl mx-auto text-center space-y-6 py-20">
            <div className="flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-10 w-10 text-muted-foreground"/>
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="text-muted-foreground">
                    {description}{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {username}
                    </code>
                </p>
            </div>
            <Link href="/" className={buttonVariants({variant: 'outline'})}>
                <ArrowLeft className="h-4 w-4 mr-2"/>
                {t.profile.backToHome}
            </Link>
        </div>
    )
}

/* ─── Social link pill ────────────────────────────────────── */
function SocialLink({
    href,
    icon: Icon,
    label,
}: {
    href: string
    icon: React.ElementType
    label: string
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
            <Icon className="h-4 w-4 shrink-0"/>
            <span className="truncate max-w-[160px]">{label}</span>
        </a>
    )
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({label, value}: {label: string; value: string}) {
    return (
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border bg-card p-4 text-center">
            <span className="text-lg font-bold" suppressHydrationWarning>{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    )
}

/* ─── Main page ───────────────────────────────────────────── */
export default function UserProfilePage() {
    const params = useParams()
    const username = params.username as string
    const {t, locale} = useI18n()

    const [profile, setProfile] = useState<PublicProfile | null>(null)
    const [pageState, setPageState] = useState<PageState>('loading')

    useEffect(() => {
        if (!username) return
        const fetchProfile = async () => {
            try {
                setPageState('loading')
                const res = await fetch(`/api/users/${encodeURIComponent(username)}`)
                if (res.status === 404) { setPageState('not_found'); return }
                if (res.status === 403) { setPageState('private'); return }
                if (!res.ok) { setPageState('not_found'); return }
                const json = await res.json()
                setProfile(json.data)
                setPageState('found')
            } catch {
                setPageState('not_found')
            }
        }
        fetchProfile()
    }, [username])

    const getInitials = (name: string) =>
        name.split(/[\s_-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US', {year: 'numeric', month: 'long', day: 'numeric'})

    const memberDays = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const days = Math.floor(diff / 86400000)
        if (days < 30) return `${days}${t.profile.daySuffix}`
        if (days < 365) return `${Math.floor(days / 30)}${t.profile.monthSuffix}`
        return `${Math.floor(days / 365)}${t.profile.yearSuffix}`
    }

    // Only allow http/https — reject javascript:, data:, etc.
    const normalizeUrl = (url: string): string => {
        try {
            const withProto = url.startsWith('http') ? url : `https://${url}`
            const parsed = new URL(withProto)
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '#'
            return withProto
        } catch {
            return '#'
        }
    }

    const displayLabel = (url: string) =>
        url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

    return (
        <main className="min-h-screen">
            <Header/>

            <div className="container mx-auto px-4 py-10">
                {/* Back button */}
                <div className="max-w-2xl mx-auto mb-6">
                    <Link
                        href="/"
                        className={buttonVariants({variant: 'ghost', size: 'sm'}) + ' -ml-2 text-muted-foreground'}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1.5"/>
                        {t.common.back}
                    </Link>
                </div>

                {pageState === 'loading' && <ProfileSkeleton/>}

                {pageState === 'not_found' && (
                    <EmptyState
                        icon={UserRound}
                        title={t.profile.userNotFound}
                        description={t.profile.noProfileFor}
                        username={username}
                    />
                )}

                {pageState === 'private' && (
                    <EmptyState
                        icon={EyeOff}
                        title={t.profile.profilePrivate}
                        description={t.profile.profilePrivateDescription}
                        username={username}
                    />
                )}

                {pageState === 'found' && profile && (
                    <div className="max-w-2xl mx-auto space-y-6">

                        {/* ── Hero card ── */}
                        <Card className="overflow-hidden">
                            {/* Cover gradient banner */}
                            <div
                                className="h-36 w-full"
                                style={{
                                    background: `linear-gradient(135deg,
                                        hsl(var(--primary) / 0.25) 0%,
                                        hsl(var(--primary) / 0.08) 50%,
                                        hsl(var(--secondary) / 0.15) 100%)`,
                                }}
                            />

                            <CardContent className="relative px-6 pb-6">
                                {/* Avatar — overlaps the banner */}
                                <div className="absolute -top-12 left-6">
                                    <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                                        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username}/>
                                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                            {getInitials(profile.username)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Spacer for avatar overflow */}
                                <div className="pt-14 space-y-4">
                                    {/* Name + username + badge */}
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h1 className="text-2xl font-bold leading-tight">
                                                {profile.display_name || profile.username}
                                            </h1>
                                            <Badge variant="secondary" className="text-xs font-normal">
                                                @{profile.username}
                                            </Badge>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1" suppressHydrationWarning>
                                                <Calendar className="h-3.5 w-3.5"/>
                                                {tFormat(t.dashboard.joined, {date: formatDate(profile.created_at)})}
                                            </span>
                                            {profile.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5"/>
                                                    {profile.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {profile.bio ? (
                                        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                                            {profile.bio}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground/50 italic">{t.profile.noBioYet}</p>
                                    )}

                                    {/* Social links */}
                                    {(profile.website || profile.twitter_handle || profile.github_handle) && (
                                        <div className="flex flex-wrap gap-4 pt-1">
                                            {profile.website && (
                                                <SocialLink
                                                    href={normalizeUrl(profile.website)}
                                                    icon={Globe}
                                                    label={displayLabel(profile.website)}
                                                />
                                            )}
                                            {profile.twitter_handle && (
                                                <SocialLink
                                                    href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`}
                                                    icon={Twitter}
                                                    label={`@${profile.twitter_handle.replace(/^@/, '')}`}
                                                />
                                            )}
                                            {profile.github_handle && (
                                                <SocialLink
                                                    href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`}
                                                    icon={Github}
                                                    label={profile.github_handle.replace(/^@/, '')}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Stats row ── */}
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard label={t.profile.memberFor} value={memberDays(profile.created_at)}/>
                            <StatCard
                                label={t.settings.websiteLabel}
                                value={profile.website ? '✓' : '—'}
                            />
                            <StatCard
                                label={t.profile.socials}
                                value={[profile.twitter_handle, profile.github_handle].filter(Boolean).length.toString()}
                            />
                        </div>

                        {/* ── About card ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{t.profile.aboutTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">{t.dashboard.username}</span>
                                    <span className="font-mono font-medium text-right">@{profile.username}</span>
                                </div>
                                {profile.display_name && (
                                    <>
                                        <Separator/>
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-muted-foreground shrink-0">{t.settings.displayNameLabel}</span>
                                            <span className="font-medium text-right">{profile.display_name}</span>
                                        </div>
                                    </>
                                )}
                                {profile.location && (
                                    <>
                                        <Separator/>
                                        <div className="flex items-start justify-between gap-4">
                                            <span className="text-muted-foreground shrink-0">{t.settings.locationLabel}</span>
                                            <span className="text-right">{profile.location}</span>
                                        </div>
                                    </>
                                )}
                                <Separator/>
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-muted-foreground shrink-0">{t.settings.memberSinceLabel}</span>
                                    <span className="text-right" suppressHydrationWarning>{formatDate(profile.created_at)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <p className="text-center text-xs text-muted-foreground pb-4">
                            {t.profile.publicProfileFooter}
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}
