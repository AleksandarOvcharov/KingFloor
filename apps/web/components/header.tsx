'use client'

import {useState, useEffect, useMemo} from 'react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {useAuth} from '@/hooks/useAuth'
import {useProfile} from '@/hooks/useProfile'
import {Button, buttonVariants} from '@workspace/ui/ui/button'
import {cn} from '@/lib/utils'
import {ThemeToggle} from '@/components/theme-toggle'
import {LanguageToggle} from '@/components/language-toggle'
import {AccessibilityToggle} from '@/components/accessibility-toggle'
import {UserMenu} from '@/components/user-menu'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {useI18n} from '@/lib/i18n/provider'
import {
    Menu,
    Rocket,
    X,
    LogIn,
    UserPlus,
    LayoutDashboard,
    Sparkles,
    Layers,
    Info,
    Settings,
    LogOut,
} from 'lucide-react'

export function Header() {
    const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME || 'Hackathon Template'
    const {user, logout} = useAuth()
    const {profile} = useProfile(user)
    const {t} = useI18n()
    const pathname = usePathname()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    // Lock body scrolling when mobile menu is active
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileMenuOpen])

    // Close mobile menu on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mobileMenuOpen])

    const handleLogout = async () => {
        setMobileMenuOpen(false)
        await logout()
        router.push('/')
    }

    const username = profile?.username || user?.email?.split('@')[0] || 'User'
    const initials = username.substring(0, 2).toUpperCase()

    const navLinks = useMemo(
        () => [
            ...(user ? [{label: t.common.dashboard, href: '/dashboard', icon: LayoutDashboard}] : []),
            {label: t.nav.features, href: '/features', icon: Layers},
            {label: t.nav.ai, href: '/ai', icon: Sparkles},
            {label: t.nav.about, href: '/about', icon: Info},
        ],
        [user, t],
    )

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
            <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
                {/* Brand Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 min-w-0 transition-opacity hover:opacity-90 shrink"
                    aria-label={`${projectName} — Home`}
                >
                    <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" aria-hidden="true" />
                    <span className="font-bold text-base sm:text-lg tracking-tight truncate">
                        {projectName}
                    </span>
                </Link>

                {/* Desktop nav (>= 768px) */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0" aria-label="Desktop navigation">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    buttonVariants({
                                        variant: isActive ? 'secondary' : 'ghost',
                                        size: 'sm',
                                    }),
                                    'text-sm transition-colors',
                                    isActive
                                        ? 'font-medium bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                    <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
                    <LanguageToggle />
                    <AccessibilityToggle />
                    <ThemeToggle />
                    <UserMenu />
                </nav>

                {/* Mobile nav controls (< 768px) */}
                <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
                    <ThemeToggle />
                    {user && <UserMenu hideWhenLoggedOut={true} />}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </Button>
                </div>
            </div>

            {/* Mobile menu backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 top-14 z-30 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile menu overlay dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 z-40 border-b bg-background/95 backdrop-blur-md shadow-xl md:hidden animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
                    <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
                        {/* User Profile Card (if logged in) */}
                        {user && (
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 mb-1">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={profile?.avatar_url || undefined} alt={username} />
                                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium leading-none truncate">{username}</span>
                                    <span className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</span>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        buttonVariants({
                                            variant: isActive ? 'secondary' : 'ghost',
                                        }),
                                        'w-full justify-start gap-2.5 text-sm h-10',
                                        isActive ? 'font-semibold bg-accent text-accent-foreground' : 'text-muted-foreground',
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{link.label}</span>
                                </Link>
                            )
                        })}

                        {/* Authenticated Settings & Logout in Mobile Menu */}
                        {user && (
                            <>
                                <div className="border-t my-1" />
                                <Link
                                    href="/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        buttonVariants({variant: 'ghost'}),
                                        'w-full justify-start gap-2.5 text-sm h-10 text-muted-foreground',
                                    )}
                                >
                                    <Settings className="h-4 w-4 shrink-0" />
                                    <span>{t.common.settings}</span>
                                </Link>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="w-full justify-start gap-2.5 text-sm h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-4 w-4 shrink-0" />
                                    <span>{t.common.logout}</span>
                                </Button>
                            </>
                        )}

                        {/* Unauthenticated Login & Sign Up in Mobile Menu */}
                        {!user && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-1">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        buttonVariants({variant: 'outline', size: 'sm'}),
                                        'w-full gap-1.5 text-xs h-9',
                                    )}
                                >
                                    <LogIn className="h-3.5 w-3.5" />
                                    {t.common.login}
                                </Link>
                                <Link
                                    href="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        buttonVariants({size: 'sm'}),
                                        'w-full gap-1.5 text-xs h-9',
                                    )}
                                >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    {t.common.signup}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
