export interface FileValidationRule {
    maxSizeBytes: number
    allowedTypes: string[]
    allowedExtensions?: string[]
}

export interface UploadResult {
    success: boolean
    url?: string
    path?: string
    error?: string
}

export interface UploadOptions {
    bucket: string
    path: string
    upsert?: boolean
    cacheControl?: string
    contentType?: string
}

export interface FileUploadState {
    file: File | null
    preview: string | null
    uploading: boolean
    progress: number
    error: string | null
}

export const FILE_PRESETS = {
    avatar: {
        maxSizeBytes: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    image: {
        maxSizeBytes: 10 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    },
    document: {
        maxSizeBytes: 25 * 1024 * 1024,
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/csv',
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.csv'],
    },
    any: {
        maxSizeBytes: 50 * 1024 * 1024,
        allowedTypes: ['*'],
        allowedExtensions: undefined,
    },
} as const satisfies Record<string, FileValidationRule>

export type FilePreset = keyof typeof FILE_PRESETS
