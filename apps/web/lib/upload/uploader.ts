import {supabase} from '@/lib/supabase/client'
import {UploadOptions, UploadResult} from './types'
import {getFileExtension} from './validators'

export async function uploadToStorage(
    file: File,
    options: UploadOptions
): Promise<UploadResult> {
    const {bucket, path, upsert = true, contentType} = options

    try {
        const {error: uploadError} = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                upsert,
                contentType: contentType || file.type,
            })

        if (uploadError) {
            return {success: false, error: uploadError.message}
        }

        const {data} = supabase.storage.from(bucket).getPublicUrl(path)
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`

        return {success: true, url: publicUrl, path}
    } catch (err: any) {
        return {success: false, error: err.message || 'Upload failed'}
    }
}

export async function deleteFromStorage(
    bucket: string,
    paths: string[]
): Promise<{success: boolean; error?: string}> {
    try {
        const {error} = await supabase.storage.from(bucket).remove(paths)
        if (error) return {success: false, error: error.message}
        return {success: true}
    } catch (err: any) {
        return {success: false, error: err.message}
    }
}

export function buildStoragePath(
    userId: string,
    filename: string,
    folder?: string
): string {
    const ext = getFileExtension(filename)
    const timestamp = Date.now()
    const safeName = `${timestamp}${ext}`
    const parts = [userId]
    if (folder) parts.push(folder)
    parts.push(safeName)
    return parts.join('/')
}

export function buildAvatarPath(userId: string, filename: string): string {
    const ext = getFileExtension(filename)
    return `${userId}/avatar${ext}`
}
