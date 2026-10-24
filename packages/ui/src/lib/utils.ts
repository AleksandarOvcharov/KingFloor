import {type ClassValue, clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'

// Same 3-line helper as apps/web/lib/utils.ts's cn() (duplicated, not
// imported from there — apps/web can't be a dependency of this package).
// Keep both in sync if this ever needs to change.
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
