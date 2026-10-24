'use client'

import * as React from 'react'
import {Check, Copy} from 'lucide-react'
import {cn} from '@/lib/utils'
import {copyToClipboard} from '@/lib/copy-to-clipboard'
import {notify} from '@/lib/notify'
import {Button, type ButtonProps} from '@workspace/ui/ui/button'
import {useI18n} from '@/lib/i18n/provider'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
    value: string
    label?: string
    successMessage?: string
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
    ({value, label, successMessage, className, variant = 'outline', size = 'sm', children, ...props}, ref) => {
        const {t} = useI18n()
        const [copied, setCopied] = React.useState(false)

        const handleCopy = async () => {
            const ok = await copyToClipboard(value)
            if (ok) {
                setCopied(true)
                notify.success(successMessage ?? t.export.copiedToClipboard)
                setTimeout(() => setCopied(false), 2000)
            } else {
                notify.error(t.export.failedToCopy)
            }
        }

        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                className={cn('gap-1.5', className)}
                onClick={handleCopy}
                {...props}
            >
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-success"/>
                ) : (
                    <Copy className="h-3.5 w-3.5"/>
                )}
                {children ?? label}
            </Button>
        )
    },
)
CopyButton.displayName = 'CopyButton'

export {CopyButton}
