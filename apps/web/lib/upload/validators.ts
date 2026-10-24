import {FILE_PRESETS, FilePreset, FileValidationRule} from './types'
import {tFormat} from '@/lib/i18n/provider'
import type {Dictionary} from '@/lib/i18n/dictionaries'

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export function getFileExtension(filename: string): string {
    const dot = filename.lastIndexOf('.')
    return dot !== -1 ? filename.slice(dot).toLowerCase() : ''
}

export function getValidationRule(preset: FilePreset | FileValidationRule): FileValidationRule {
    if (typeof preset === 'string') {
        return FILE_PRESETS[preset]
    }
    return preset
}

export function validateFile(
    file: File,
    rules: FileValidationRule,
    t: Dictionary
): { valid: boolean; error?: string } {
    if (file.size > rules.maxSizeBytes) {
        return {
            valid: false,
            error: tFormat(t.upload.sizeExceeds, {size: formatFileSize(file.size), limit: formatFileSize(rules.maxSizeBytes)}),
        }
    }

    if (rules.allowedTypes[0] !== '*' && !rules.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: tFormat(t.upload.typeNotAllowed, {type: file.type || 'unknown', accepted: rules.allowedTypes.join(', ')}),
        }
    }

    if (rules.allowedExtensions) {
        const ext = getFileExtension(file.name)
        if (!rules.allowedExtensions.includes(ext)) {
            return {
                valid: false,
                error: tFormat(t.upload.extensionNotAllowed, {ext, accepted: rules.allowedExtensions.join(', ')}),
            }
        }
    }

    return {valid: true}
}

export function getAcceptString(rules: FileValidationRule): string {
    if (rules.allowedTypes[0] === '*') return '*'
    return rules.allowedTypes.join(',')
}

export function getHumanReadableTypes(rules: FileValidationRule, t: Dictionary): string {
    if (rules.allowedExtensions) {
        return rules.allowedExtensions.map((e) => e.replace('.', '').toUpperCase()).join(', ')
    }
    if (rules.allowedTypes[0] === '*') return t.upload.allFiles
    return rules.allowedTypes.map((type) => type.split('/')[1].toUpperCase()).join(', ')
}
