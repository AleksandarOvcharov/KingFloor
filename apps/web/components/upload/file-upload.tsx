'use client'

import {useCallback} from 'react'
import {cn} from '@/lib/utils'
import {FilePreset, FileValidationRule, UploadOptions, UploadResult} from '@/lib/upload'
import {useFileUpload} from '@/hooks/useFileUpload'
import {FileDropzone} from './file-dropzone'
import {UploadProgress} from './upload-progress'
import {Button} from '@workspace/ui/ui/button'
import {useI18n} from '@/lib/i18n/provider'
import {Loader2, Upload} from 'lucide-react'

interface FileUploadProps {
    validation: FilePreset | FileValidationRule
    uploadOptions: UploadOptions
    onUploadComplete?: (result: UploadResult) => void
    onError?: (error: string) => void
    onFileSelect?: (file: File) => void
    autoUpload?: boolean
    disabled?: boolean
    compact?: boolean
    className?: string
    label?: string
    hint?: string
    showUploadButton?: boolean
    uploadButtonText?: string
}

export function FileUpload({
    validation,
    uploadOptions,
    onUploadComplete,
    onError,
    onFileSelect: onFileSelectProp,
    autoUpload = false,
    disabled = false,
    compact = false,
    className,
    label,
    hint,
    showUploadButton = true,
    uploadButtonText,
}: FileUploadProps) {
    const {t} = useI18n()
    const {
        file,
        preview,
        uploading,
        progress,
        error,
        selectFile,
        upload,
        reset,
    } = useFileUpload({
        validation,
        onUploadComplete: (result) => {
            onUploadComplete?.(result)
        },
        onError,
    })

    const handleFileSelect = useCallback(
        (selectedFile: File) => {
            const accepted = selectFile(selectedFile)
            if (accepted) {
                onFileSelectProp?.(selectedFile)
                if (autoUpload) {
                    upload(uploadOptions)
                }
            }
        },
        [selectFile, onFileSelectProp, autoUpload, upload, uploadOptions]
    )

    const handleUpload = useCallback(() => {
        upload(uploadOptions)
    }, [upload, uploadOptions])

    return (
        <div className={cn('space-y-3', className)}>
            <FileDropzone
                validation={validation}
                onFileSelect={handleFileSelect}
                preview={preview}
                selectedFile={file}
                onClear={reset}
                disabled={disabled || uploading}
                compact={compact}
                label={label}
                hint={hint}
            />

            <UploadProgress
                progress={progress}
                uploading={uploading}
                error={error}
            />

            {file && showUploadButton && !autoUpload && !uploading && progress !== 100 && (
                <Button
                    onClick={handleUpload}
                    disabled={disabled || uploading}
                    size={compact ? 'sm' : 'default'}
                    className="w-full"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.modal.uploading}
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadButtonText ?? t.common.upload}
                        </>
                    )}
                </Button>
            )}
        </div>
    )
}
