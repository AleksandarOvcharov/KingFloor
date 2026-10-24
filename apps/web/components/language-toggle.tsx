'use client'

import {Check, ChevronDown} from 'lucide-react'
import {GB, BG} from 'country-flag-icons/react/3x2'
import {useI18n} from '@/lib/i18n/provider'
import {LOCALES, LANGUAGE_META, type Locale} from '@/lib/i18n/dictionaries'
import {Button} from '@workspace/ui/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/ui/dropdown-menu'

// LANGUAGE_META's `flag` is an emoji (shared with apps/mobile, which renders
// it as plain text) — web swaps in an SVG flag per locale instead.
const FLAG_ICONS: Record<Locale, typeof GB> = {en: GB, bg: BG}

export function LanguageToggle() {
    const {locale, setLocale, t} = useI18n()
    const CurrentFlag = FLAG_ICONS[locale]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t.accessibility.language}
                    className="gap-1.5 px-2"
                >
                    <CurrentFlag className="h-3.5 w-auto rounded-[2px]" aria-hidden="true"/>
                    <span className="text-xs font-medium uppercase">{locale}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                {LOCALES.map((loc) => {
                    const meta = LANGUAGE_META[loc]
                    const Flag = FLAG_ICONS[loc]
                    return (
                        <DropdownMenuItem
                            key={loc}
                            onClick={() => setLocale(loc)}
                            className="cursor-pointer gap-2"
                        >
                            <Flag className="h-3.5 w-auto rounded-[2px]" aria-hidden="true"/>
                            <span className="flex-1">{meta.nativeName}</span>
                            {locale === loc && <Check className="h-4 w-4 text-primary"/>}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
