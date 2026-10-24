'use client'

import {useCallback, useRef, useState} from 'react'
import {cn} from '@/lib/utils'
import {
    FilePreset,
    FileValidationRule,
    formatFileSize,
    getAcceptString,
    getHumanReadableTypes,
    getValidationRule,
    validateFile,
} from '@/lib/upload'
import {CloudUpload, File as FileIcon, X} from 'lucide-react'
import {Button} from '@workspace/ui/ui/button'
import {useI18n, tFormat} from '@/lib/i18n/provider'

interface FileDropzoneProps {
    validation: FilePreset | FileValidationRule
    onFileSelect: (file: File) => void
    preview?: string | null
    selectedFile?: File | null
    onClear?: () => void
    disabled?: boolean
    compact?: boolean
    className?: string
    label?: string
    hint?: string
}

export function FileDropzone({
    validation,
    onFileSelect,
    preview,
    selectedFile,
    onClear,
    disabled = false,
    compact = false,
    className,
    label,
    hint,
}: FileDropzoneProps) {
    const {t} = useI18n()
    const [dragOver, setDragOver] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const rules = getValidationRule(validation)
    const accept = getAcceptString(rules)
    const typeLabel = getHumanReadableTypes(rules, t)
    const maxSize = formatFileSize(rules.maxSizeBytes)

    const handleFile = useCallback(
        (file: File) => {
            setLocalError(null)
            const result = validateFile(file, rules, t)
            if (!result.valid) {
                setLocalError(result.error!)
                return
            }
            onFileSelect(file)
        },
        [rules, onFileSelect, t]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            if (disabled) return

            const file = e.dataTransfer.files?.[0]
            if (file) handleFile(file)
        },
        [disabled, handleFile]
    )

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            if (!disabled) setDragOver(true)
        },
        [disabled]
    )

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
    }, [])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            if (inputRef.current) inputRef.current.value = ''
        },
        [handleFile]
    )

    const handleClick = useCallback(() => {
        if (!disabled) inputRef.current?.click()
    }, [disabled])

    const handleClear = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            setLocalError(null)
            onClear?.()
        },
        [onClear]
    )

    const hasFile = !!selectedFile
    const isImage = selectedFile?.type.startsWith('image/')

    return (
        <div className={cn('w-full', className)}>
            {label && (
                <p className="text-sm font-medium mb-2">{label}</p>
            )}

            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
                    'hover:border-primary/50 hover:bg-accent/50',
                    dragOver && 'border-primary bg-accent/50 scale-[1.01]',
                    disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
                    localError && 'border-destructive/50',
                    hasFile && !localError && 'border-primary/30 bg-accent/20',
                    compact ? 'p-4' : 'p-6',
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                {hasFile ? (
                    <div className={cn(
                        'flex items-center gap-4',
                        compact ? 'flex-row' : 'flex-col sm:flex-row',
                    )}>
                        {/* Preview */}
                        {isImage && preview ? (
                            <div className={cn(
                                'shrink-0 rounded-lg overflow-hidden bg-muted border',
                                compact ? 'h-12 w-12' : 'h-20 w-20',
                            )}>
                                <img
                                    src={preview}
                                    alt={t.upload.previewAlt}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className={cn(
                                'shrink-0 flex items-center justify-center rounded-lg bg-muted border',
                                compact ? 'h-12 w-12' : 'h-20 w-20',
                            )}>
                                <FileIcon className={cn(
                                    'text-muted-foreground',
                                    compact ? 'h-5 w-5' : 'h-8 w-8',
                                )} />
                            </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>

                        {/* Clear button */}
                        {onClear && !disabled && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-8 w-8 rounded-full"
                                onClick={handleClear}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        'flex flex-col items-center text-center',
                        compact ? 'gap-2' : 'gap-3',
                    )}>
                        <div className={cn(
                            'rounded-full bg-muted flex items-center justify-center',
                            compact ? 'h-10 w-10' : 'h-12 w-12',
                        )}>
                            <CloudUpload className={cn(
                                'text-muted-foreground',
                                compact ? 'h-5 w-5' : 'h-6 w-6',
                            )} />
                        </div>
                        <div>
                            <p className={cn(
                                'font-medium',
                                compact ? 'text-xs' : 'text-sm',
                            )}>
                                <span className="text-primary">{t.upload.clickToUpload}</span>
                                {' '}{t.upload.orDragAndDrop}
                            </p>
                            <p className={cn(
                                'text-muted-foreground mt-1',
                                compact ? 'text-[10px]' : 'text-xs',
                            )}>
                                {hint || tFormat(t.upload.maxLabel, {type: typeLabel, size: maxSize})}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {localError && (
                <p className="text-xs text-destructive mt-2">{localError}</p>
            )}
        </div>
    )
}
