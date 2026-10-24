'use client'

import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/hooks/useAuth'
import {useProfile} from '@/hooks/useProfile'
import {useTheme} from '@/hooks/useTheme'
import {useToast} from '@/hooks/useToast'
import {useModal} from '@/hooks/useModal'
import {useAccessibility} from '@/hooks/useAccessibility'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {Header} from '@/components/header'
import {LanguageToggle} from '@/components/language-toggle'
import {Button, buttonVariants} from '@workspace/ui/ui/button'
import {Input} from '@workspace/ui/ui/input'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Label} from '@workspace/ui/ui/label'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {Badge} from '@workspace/ui/ui/badge'
import {Switch} from '@workspace/ui/ui/switch'
import {Separator} from '@workspace/ui/ui/separator'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@workspace/ui/ui/tabs'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {ImageCropModal} from '@/components/image-crop-modal'
import {FileDropzone} from '@/components/upload'
import {ConfirmModal} from '@/components/modal/modal-templates'
import {AlertTriangle, Glasses, Globe, Languages, Lock, Loader2, Mail, Moon, Shield, Trash2} from 'lucide-react'

export default function SettingsPage() {
    const {user, loading: authLoading, deleteAccount} = useAuth()
    const {
        profile,
        loading: profileLoading,
        updateUsername,
        updateBio,
        uploadAvatar,
        updateExtended,
        updateVisibility,
    } = useProfile(user)
    const {theme, toggle: toggleTheme} = useTheme()
    const {colorblindMode, setColorblindMode} = useAccessibility()
    const {t, locale} = useI18n()
    const {addToast} = useToast()
    const router = useRouter()

    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [initialLoaded, setInitialLoaded] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isUpdatingBio, setIsUpdatingBio] = useState(false)
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
    const [isUpdatingExtended, setIsUpdatingExtended] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Extended profile fields
    const [displayName, setDisplayName] = useState('')
    const [location, setLocation] = useState('')
    const [website, setWebsite] = useState('')
    const [twitterHandle, setTwitterHandle] = useState('')
    const [githubHandle, setGithubHandle] = useState('')
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const [isCropModalOpen, setIsCropModalOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const deleteModal = useModal()

    const bioRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router, mounted])

    useEffect(() => {
        if (profile && !initialLoaded) {
            setUsername(profile.username || '')
            setBio(profile.bio || '')
            setDisplayName(profile.display_name || '')
            setLocation(profile.location || '')
            setWebsite(profile.website || '')
            setTwitterHandle(profile.twitter_handle || '')
            setGithubHandle(profile.github_handle || '')
            setInitialLoaded(true)
        }
    }, [profile, initialLoaded])

    useEffect(() => {
        const el = bioRef.current
        if (!el) return

        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }, [bio])

    if (!mounted || authLoading || (user && profileLoading)) {
        return (
            <main className="min-h-screen">
                <Header/>
                <div className="container mx-auto px-4 py-8 sm:py-16">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-32"/>
                            <Skeleton className="h-5 w-64"/>
                        </div>
                        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                            <div className="space-y-6">
                                <Skeleton className="h-[280px] rounded-xl"/>
                                <Skeleton className="h-[160px] rounded-xl"/>
                            </div>
                            <div className="space-y-6">
                                <Skeleton className="h-[200px] rounded-xl"/>
                                <Skeleton className="h-[240px] rounded-xl"/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    if (!user) {
        return null
    }

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBio(e.target.value)

        const el = bioRef.current
        if (!el) return

        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }

    const handleUsernameUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!username.trim()) {
            addToast({
                title: t.auth.error,
                description: t.settings.usernameEmptyError,
                variant: 'error',
            })
            return
        }

        if (username === profile?.username) {
            addToast({
                title: t.status.info,
                description: t.settings.usernameSameInfo,
                variant: 'default',
            })
            return
        }

        setIsUpdating(true)
        const result = await updateUsername(username.trim())
        setIsUpdating(false)

        if (result.success) {
            addToast({
                title: t.status.successExclaim,
                description: tFormat(t.settings.usernameUpdatedToast, {username}),
                variant: 'success',
            })
        } else {
            addToast({
                title: t.auth.error,
                description: result.error || t.settings.usernameUpdateFailed,
                variant: 'error',
            })
            setUsername(profile?.username || '')
        }
    }

    const handleBioUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (bio === (profile?.bio || '')) {
            addToast({
                title: t.status.info,
                description: t.settings.bioSameInfo,
                variant: 'default',
            })
            return
        }

        setIsUpdatingBio(true)
        const result = await updateBio(bio.trim())
        setIsUpdatingBio(false)

        if (result.success) {
            addToast({
                title: t.status.successExclaim,
                description: t.settings.bioUpdatedToast,
                variant: 'success',
            })
        } else {
            addToast({
                title: t.auth.error,
                description: result.error || t.settings.bioUpdateFailed,
                variant: 'error',
            })
            setBio(profile?.bio || '')
        }
    }

    const handleAvatarFileSelect = (file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            setImageToCrop(reader.result as string)
            setIsCropModalOpen(true)
        }
        reader.readAsDataURL(file)
    }

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        setIsUploading(true)

        // Convert blob to file
        const croppedFile = new File([croppedImageBlob], 'avatar.jpg', {
            type: 'image/jpeg',
        })

        const result = await uploadAvatar(croppedFile)
        setIsUploading(false)
        setIsCropModalOpen(false)
        setImageToCrop(null)

        if (result.success) {
            addToast({
                title: t.status.successExclaim,
                description: t.settings.avatarUpdatedToast,
                variant: 'success',
            })
        } else {
            addToast({
                title: t.auth.error,
                description: result.error || t.settings.avatarUpdateFailed,
                variant: 'error',
            })
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        const {error} = await deleteAccount()
        setIsDeleting(false)
        deleteModal.close()

        if (error) {
            addToast({
                title: t.auth.error,
                description: error.message,
                variant: 'error',
            })
        } else {
            router.push('/')
        }
    }

    const displayUsername = profile?.username || user?.email?.split('@')[0] || 'User'
    const initials = displayUsername.substring(0, 2).toUpperCase()

    return (
        <main className="min-h-screen">
            <Header/>

            {imageToCrop && (
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    onClose={() => {
                        setIsCropModalOpen(false)
                        setImageToCrop(null)
                    }}
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    isUploading={isUploading}
                />
            )}

            <div className="container mx-auto px-4 py-8 sm:py-16">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t.common.settings}</h1>
                        <p className="text-muted-foreground mt-2">
                            {t.settings.pageDescription}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                        {/* Left column — Profile picture + Account info */}
                        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            {/* Profile Picture */}
                            <Card>
                                <CardContent className="pt-6 flex flex-col items-center text-center">
                                    <div className="relative">
                                        <Avatar className="h-28 w-28">
                                            <AvatarImage src={profile?.avatar_url || undefined} alt={displayUsername}/>
                                            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                                        </Avatar>
                                        {isUploading && (
                                            <div
                                                className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                                                <Loader2 className="h-8 w-8 animate-spin"/>
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="mt-4 font-semibold text-lg">{displayUsername}</h2>
                                    <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                                    <FileDropzone
                                        validation="avatar"
                                        onFileSelect={handleAvatarFileSelect}
                                        disabled={isUploading}
                                        compact
                                        hint={t.settings.avatarHint}
                                    />
                                </CardContent>
                            </Card>

                            {/* Account Information */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{t.settings.accountCardTitle}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.auth.email}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{user?.email}</p>
                                            <Badge variant={user?.email_confirmed_at ? 'default' : 'outline'}
                                                   className="text-[10px] px-1.5 py-0">
                                                {user?.email_confirmed_at ? t.status.verified : t.status.unverified}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.dashboard.userId}</p>
                                        <p className="text-xs font-mono text-muted-foreground truncate">{user?.id}</p>
                                    </div>
                                    <Separator/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.settings.authProviderLabel}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Shield className="h-3 w-3 text-muted-foreground"/>
                                            <p className="text-sm capitalize">{user?.app_metadata?.provider || 'email'}</p>
                                        </div>
                                    </div>
                                    <Separator/>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.settings.memberSinceLabel}</p>
                                        <p className="text-sm" suppressHydrationWarning>
                                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(locale === 'bg' ? 'bg-BG' : 'en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : t.dashboard.notAvailable}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right column — Tabbed settings */}
                        <Tabs defaultValue="profile" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="profile">{t.settings.tabProfile}</TabsTrigger>
                                <TabsTrigger value="preferences">{t.settings.tabPreferences}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.dashboard.username}</CardTitle>
                                        <CardDescription>
                                            {t.settings.usernameCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleUsernameUpdate} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="username">{t.dashboard.username}</Label>
                                                <div className="flex gap-3">
                                                    <Input
                                                        id="username"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        placeholder={t.settings.usernamePlaceholder}
                                                        disabled={isUpdating}
                                                        className="flex-1"
                                                    />
                                                    <Button type="submit" disabled={isUpdating} className="shrink-0">
                                                        {isUpdating ? (
                                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                                        ) : (
                                                            t.common.save
                                                        )}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t.settings.current} <span
                                                    className="font-medium">{profile?.username || t.dashboard.notSet}</span>
                                                </p>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.settings.bioCardTitle}</CardTitle>
                                        <CardDescription>
                                            {t.settings.bioCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleBioUpdate} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bio">{t.settings.bioLabel}</Label>
                                                <Textarea
                                                    ref={bioRef}
                                                    id="bio"
                                                    value={bio}
                                                    onChange={handleBioChange}
                                                    placeholder={t.settings.bioPlaceholder}
                                                    disabled={isUpdatingBio}
                                                    rows={1}
                                                    maxLength={300}
                                                    className="resize-none overflow-hidden min-h-20"
                                                />
                                                <div className="flex items-center justify-between">
                                                    <Button type="submit" disabled={isUpdatingBio}>
                                                        {isUpdatingBio ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                                {t.settings.updating}
                                                            </>
                                                        ) : (
                                                            t.settings.saveBio
                                                        )}
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground">
                                                        {bio.length}/300
                                                    </p>
                                                </div>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.settings.extendedCardTitle}</CardTitle>
                                        <CardDescription>
                                            {t.settings.extendedCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault()
                                                setIsUpdatingExtended(true)
                                                const result = await updateExtended({
                                                    display_name: displayName.trim() || null,
                                                    location: location.trim() || null,
                                                    website: website.trim() || null,
                                                    twitter_handle: twitterHandle.trim() || null,
                                                    github_handle: githubHandle.trim() || null,
                                                })
                                                setIsUpdatingExtended(false)
                                                if (result.success) {
                                                    addToast({title: t.status.successExclaim, description: t.settings.profileInfoUpdatedToast, variant: 'success'})
                                                } else {
                                                    addToast({title: t.auth.error, description: result.error || t.settings.profileInfoUpdateFailed, variant: 'error'})
                                                }
                                            }}
                                            className="space-y-4"
                                        >
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="display-name">{t.settings.displayNameLabel}</Label>
                                                    <Input
                                                        id="display-name"
                                                        value={displayName}
                                                        onChange={e => setDisplayName(e.target.value)}
                                                        placeholder={t.settings.displayNamePlaceholder}
                                                        maxLength={60}
                                                        disabled={isUpdatingExtended}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">{t.settings.locationLabel}</Label>
                                                    <Input
                                                        id="location"
                                                        value={location}
                                                        onChange={e => setLocation(e.target.value)}
                                                        placeholder={t.settings.locationPlaceholder}
                                                        maxLength={80}
                                                        disabled={isUpdatingExtended}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="website">{t.settings.websiteLabel}</Label>
                                                    <Input
                                                        id="website"
                                                        value={website}
                                                        onChange={e => setWebsite(e.target.value)}
                                                        placeholder="https://yoursite.com"
                                                        maxLength={200}
                                                        disabled={isUpdatingExtended}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="twitter">{t.settings.twitterLabel}</Label>
                                                    <Input
                                                        id="twitter"
                                                        value={twitterHandle}
                                                        onChange={e => setTwitterHandle(e.target.value)}
                                                        placeholder="@handle"
                                                        maxLength={50}
                                                        disabled={isUpdatingExtended}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="github">{t.settings.githubLabel}</Label>
                                                    <Input
                                                        id="github"
                                                        value={githubHandle}
                                                        onChange={e => setGithubHandle(e.target.value)}
                                                        placeholder="username"
                                                        maxLength={50}
                                                        disabled={isUpdatingExtended}
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" disabled={isUpdatingExtended}>
                                                {isUpdatingExtended ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t.settings.saving}</>
                                                ) : t.settings.saveInfo}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.settings.visibilityCardTitle}</CardTitle>
                                        <CardDescription>
                                            {t.settings.visibilityCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {profile?.is_public
                                                    ? <Globe className="h-4 w-4 text-success"/>
                                                    : <Lock className="h-4 w-4 text-muted-foreground"/>}
                                                <div>
                                                    <Label htmlFor="profile-public"
                                                           className="text-sm font-medium cursor-pointer">
                                                        {profile?.is_public ? t.settings.publicProfile : t.settings.privateProfile}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {profile?.is_public
                                                            ? t.settings.publicProfileDescription
                                                            : t.settings.privateProfileDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="profile-public"
                                                checked={!!profile?.is_public}
                                                disabled={isUpdatingVisibility}
                                                onCheckedChange={async (checked) => {
                                                    setIsUpdatingVisibility(true)
                                                    const result = await updateVisibility(checked)
                                                    setIsUpdatingVisibility(false)
                                                    if (result.success) {
                                                        addToast({
                                                            title: checked ? t.settings.profileNowPublic : t.settings.profileNowPrivate,
                                                            description: checked
                                                                ? tFormat(t.settings.profileNowPublicDescription, {username: profile?.username || ''})
                                                                : t.settings.profileNowPrivateDescription,
                                                            variant: 'success',
                                                        })
                                                    } else {
                                                        addToast({
                                                            title: t.auth.error,
                                                            description: result.error || t.settings.visibilityUpdateFailed,
                                                            variant: 'error',
                                                        })
                                                    }
                                                }}
                                            />
                                        </div>
                                        {profile?.is_public && profile?.username && (
                                            <>
                                                <Separator/>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.settings.publicUrl}{' '}
                                                        <code className="font-mono">/users/{profile.username}</code>
                                                    </p>
                                                    <a
                                                        href={`/users/${profile.username}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={buttonVariants({variant: 'outline', size: 'sm'})}
                                                    >
                                                        {t.settings.viewProfile}
                                                    </a>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>


                            <TabsContent value="preferences" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.settings.appearanceCardTitle}</CardTitle>
                                        <CardDescription>
                                            {t.settings.appearanceCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Moon className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <Label htmlFor="dark-mode"
                                                           className="text-sm font-medium cursor-pointer">
                                                        {t.settings.darkMode}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.settings.darkModeDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="dark-mode"
                                                checked={theme === 'dark'}
                                                onCheckedChange={toggleTheme}
                                            />
                                        </div>
                                        <Separator/>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Languages className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <Label className="text-sm font-medium">
                                                        {t.accessibility.language}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.settings.languageDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <LanguageToggle/>
                                        </div>
                                        <Separator/>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Glasses className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <Label htmlFor="colorblind-mode"
                                                           className="text-sm font-medium cursor-pointer">
                                                        {t.accessibility.colorblindMode}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground max-w-sm">
                                                        {t.accessibility.colorblindModeDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="colorblind-mode"
                                                checked={colorblindMode}
                                                onCheckedChange={setColorblindMode}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t.settings.notificationsCardTitle}</CardTitle>
                                        <CardDescription>
                                            {t.settings.notificationsCardDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <Label htmlFor="email-notif"
                                                           className="text-sm font-medium cursor-pointer">
                                                        {t.settings.emailNotifications}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.settings.emailNotificationsDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch id="email-notif" defaultChecked/>
                                        </div>
                                        <Separator/>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground"/>
                                                <div>
                                                    <Label htmlFor="marketing"
                                                           className="text-sm font-medium cursor-pointer">
                                                        {t.settings.marketingEmails}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.settings.marketingEmailsDescription}
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch id="marketing"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Danger Zone — full width below the 2-column grid */}
                    <Card className="border-destructive/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive"/>
                                <CardTitle className="text-destructive">{t.settings.dangerZone}</CardTitle>
                            </div>
                            <CardDescription>
                                {t.settings.dangerZoneDescription}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
                                <div>
                                    <p className="text-sm font-medium">{t.settings.deleteAccount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t.settings.deleteAccountDescription}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteModal.open()}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    {t.settings.deleteAccount}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                open={deleteModal.isOpen}
                onClose={deleteModal.close}
                onConfirm={handleDeleteAccount}
                title={t.settings.deleteConfirmTitle}
                description={tFormat(t.settings.deleteConfirmDescription, {email: user?.email || ''})}
                confirmLabel={isDeleting ? t.settings.deletingLabel : t.settings.deleteMyAccount}
                variant="destructive"
            />
        </main>
    )
}
