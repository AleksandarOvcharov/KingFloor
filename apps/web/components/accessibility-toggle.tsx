'use client'

import {Glasses} from 'lucide-react'
import {useAccessibility} from '@/hooks/useAccessibility'
import {useI18n} from '@/lib/i18n/provider'
import {Button} from '@workspace/ui/ui/button'
import {cn} from '@/lib/utils'

export function AccessibilityToggle() {
    const {colorblindMode, toggleColorblindMode} = useAccessibility()
    const {t} = useI18n()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleColorblindMode}
            aria-label={t.accessibility.colorblindMode}
            aria-pressed={colorblindMode}
            title={t.accessibility.colorblindMode}
        >
            <Glasses className={cn('h-5 w-5', colorblindMode && 'text-primary')}/>
        </Button>
    )
}
