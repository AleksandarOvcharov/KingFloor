'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/hooks/useAuth'
import {useProfile} from '@/hooks/useProfile'
import {Button, buttonVariants} from '@workspace/ui/ui/button'
import {cn} from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/ui/dropdown-menu'
import {Avatar, AvatarFallback, AvatarImage} from '@workspace/ui/ui/avatar'
import {useI18n} from '@/lib/i18n/provider'
import {LogOut, Settings, User} from 'lucide-react'

export function UserMenu({hideWhenLoggedOut = false}: {hideWhenLoggedOut?: boolean}) {
    const {user, logout} = useAuth()
    const {profile} = useProfile(user)
    const {t} = useI18n()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    if (!user) {
        if (hideWhenLoggedOut) return null
        return (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                    href="/login"
                    className={cn(
                        buttonVariants({variant: 'ghost', size: 'sm'}),
                        'text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9',
                    )}
                >
                    {t.common.login}
                </Link>
                <Link
                    href="/signup"
                    className={cn(
                        buttonVariants({size: 'sm'}),
                        'text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9',
                    )}
                >
                    {t.common.signup}
                </Link>
            </div>
        )
    }

    const username = profile?.username || user.email?.split('@')[0] || 'User'
    const initials = username.substring(0, 2).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={username}/>
                        <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{username}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate max-w-[200px]">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4"/>
                        <span>{t.common.dashboard}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4"/>
                        <span>{t.common.settings}</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4"/>
                    <span>{t.common.logout}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
