import {useCallback, useRef, useState} from 'react'
import {
    FilePreset,
    FileUploadState,
    FileValidationRule,
    UploadOptions,
    UploadResult,
    getValidationRule,
    uploadToStorage,
    validateFile,
} from '@/lib/upload'
import {useI18n} from '@/lib/i18n/provider'

interface UseFileUploadOptions {
    validation: FilePreset | FileValidationRule
    onUploadComplete?: (result: UploadResult) => void
    onError?: (error: string) => void
}

export function useFileUpload({validation, onUploadComplete, onError}: UseFileUploadOptions) {
    const {t} = useI18n()
    const [state, setState] = useState<FileUploadState>({
        file: null,
        preview: null,
        uploading: false,
        progress: 0,
        error: null,
    })

    const previewUrlRef = useRef<string | null>(null)

    const rules = getValidationRule(validation)

    const cleanupPreview = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = null
        }
    }, [])

    const selectFile = useCallback(
        (file: File): boolean => {
            const result = validateFile(file, rules, t)

            if (!result.valid) {
                setState((prev) => ({...prev, error: result.error!}))
                onError?.(result.error!)
                return false
            }

            cleanupPreview()

            let preview: string | null = null
            if (file.type.startsWith('image/')) {
                preview = URL.createObjectURL(file)
                previewUrlRef.current = preview
            }

            setState({
                file,
                preview,
                uploading: false,
                progress: 0,
                error: null,
            })

            return true
        },
        [rules, cleanupPreview, onError, t]
    )

    const upload = useCallback(
        async (options: UploadOptions): Promise<UploadResult> => {
            if (!state.file) {
                const err = t.upload.noFileSelected
                setState((prev) => ({...prev, error: err}))
                return {success: false, error: err}
            }

            setState((prev) => ({...prev, uploading: true, progress: 10, error: null}))

            // Simulate progress steps since Supabase doesn't give real progress
            const progressInterval = setInterval(() => {
                setState((prev) => ({
                    ...prev,
                    progress: Math.min(prev.progress + 15, 85),
                }))
            }, 200)

            const result = await uploadToStorage(state.file, options)

            clearInterval(progressInterval)

            if (result.success) {
                setState((prev) => ({...prev, uploading: false, progress: 100}))
                onUploadComplete?.(result)
            } else {
                setState((prev) => ({
                    ...prev,
                    uploading: false,
                    progress: 0,
                    error: result.error!,
                }))
                onError?.(result.error!)
            }

            return result
        },
        [state.file, onUploadComplete, onError, t]
    )

    const reset = useCallback(() => {
        cleanupPreview()
        setState({
            file: null,
            preview: null,
            uploading: false,
            progress: 0,
            error: null,
        })
    }, [cleanupPreview])

    return {
        ...state,
        rules,
        selectFile,
        upload,
        reset,
    }
}
