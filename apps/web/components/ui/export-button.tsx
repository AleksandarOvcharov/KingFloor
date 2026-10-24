'use client'

import * as React from 'react'
import {Download, Check, Copy} from 'lucide-react'
import {cn} from '@/lib/utils'
import {copyToClipboard} from '@/lib/copy-to-clipboard'
import {notify} from '@/lib/notify'
import {Button, type ButtonProps} from '@workspace/ui/ui/button'
import {useI18n, tFormat} from '@/lib/i18n/provider'

interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
    /** Array of objects to export */
    data: Record<string, unknown>[]
    /** Optional column headers — if omitted, uses object keys */
    columns?: {key: string; label?: string}[]
    /** File name without extension (default: 'export') */
    filename?: string
    /** Export mode: 'download' saves a .csv file, 'copy' copies to clipboard (default: 'download') */
    mode?: 'download' | 'copy'
    label?: string
}

function toCsv(data: Record<string, unknown>[], columns?: {key: string; label?: string}[]): string {
    if (!data || data.length === 0) return ''

    const firstItem = data[0]
    const cols = columns ?? (firstItem ? Object.keys(firstItem).map((key) => ({key, label: key})) : [])
    if (cols.length === 0) return ''

    const header = cols.map((c) => `"${(c.label ?? c.key).replace(/"/g, '""')}"`).join(',')
    const rows = data.map((row) =>
        cols.map((c) => {
            const val = row?.[c.key]
            if (val == null) return ''
            const str = String(val).replace(/"/g, '""')
            return `"${str}"`
        }).join(','),
    )
    return [header, ...rows].join('\n')
}

function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
}

const ExportButton = React.forwardRef<HTMLButtonElement, ExportButtonProps>(
    ({data, columns, filename = 'export', mode = 'download', label, className, variant = 'outline', size = 'sm', children, ...props}, ref) => {
        const {t} = useI18n()
        const [done, setDone] = React.useState(false)

        const handleExport = async () => {
            if (!data || data.length === 0) {
                notify.error(t.export.nothingToExport)
                return
            }

            const csv = toCsv(data, columns)

            if (mode === 'copy') {
                const ok = await copyToClipboard(csv)
                if (ok) {
                    notify.success(t.export.tableCopied)
                } else {
                    notify.error(t.export.failedToCopy)
                }
            } else {
                downloadCsv(csv, filename)
                notify.success(tFormat(t.export.downloaded, {filename}))
            }

            setDone(true)
            setTimeout(() => setDone(false), 2000)
        }

        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                className={cn('gap-1.5', className)}
                onClick={handleExport}
                aria-label={mode === 'copy' ? t.export.copyTableAriaLabel : tFormat(t.export.downloadAriaLabel, {filename})}
                {...props}
            >
                {done ? (
                    <Check className="h-3.5 w-3.5 text-success"/>
                ) : mode === 'copy' ? (
                    <Copy className="h-3.5 w-3.5"/>
                ) : (
                    <Download className="h-3.5 w-3.5"/>
                )}
                {children ?? label ?? (mode === 'copy' ? t.export.copyCsv : t.export.exportCsv)}
            </Button>
        )
    },
)
ExportButton.displayName = 'ExportButton'

export {ExportButton, toCsv}
