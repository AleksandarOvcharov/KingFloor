// The actual dictionary data/logic (strings, pickLocale, Dictionary type,
// LANGUAGE_META, isLocale, tFormat) now lives in @workspace/shared/i18n —
// moved, not duplicated, so apps/mobile reads the exact same translations.
// This file stays as a thin re-export so every existing `from
// '@/lib/i18n/dictionaries'` import across apps/web keeps working.
export {LOCALES, LOCALE_COOKIE, isLocale, LANGUAGE_META, dictionaries, tFormat} from '@workspace/shared'
export type {Locale, Dictionary} from '@workspace/shared'
