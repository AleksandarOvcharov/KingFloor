'use client'

import {useState, useMemo} from 'react'

type SortDirection = 'asc' | 'desc'

interface SortConfig<T> {
    /** Field to sort by */
    key: keyof T & string
    /** Sort direction (default: 'asc') */
    direction?: SortDirection
    /** Sort type — 'alphabetical' uses localeCompare, 'numeric' uses number comparison,
     *  'date' parses as Date. Default: auto-detected from first non-null value. */
    type?: 'alphabetical' | 'numeric' | 'date'
}

interface UseSearchOptions<T> {
    /** Fields to search within each item */
    keys: (keyof T & string)[]
    /** Case-insensitive matching (default: true) */
    caseSensitive?: boolean
    /** Initial sort configuration. Can also be changed via setSort(). */
    sort?: SortConfig<T>
}

function detectSortType(value: unknown): 'numeric' | 'date' | 'alphabetical' {
    if (typeof value === 'number') return 'numeric'
    if (value instanceof Date) return 'date'
    if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-')) return 'date'
    return 'alphabetical'
}

function compareValues(a: unknown, b: unknown, type: 'alphabetical' | 'numeric' | 'date'): number {
    if (a == null && b == null) return 0
    if (a == null) return 1
    if (b == null) return -1

    switch (type) {
        case 'numeric':
            return Number(a) - Number(b)
        case 'date':
            return new Date(a as string).getTime() - new Date(b as string).getTime()
        case 'alphabetical':
        default:
            return String(a).localeCompare(String(b))
    }
}

/**
 * Lightweight filtering + sorting hook for arrays.
 *
 * Usage:
 *   const { query, setQuery, filtered, sort, setSort } = useSearch(products, {
 *     keys: ['name', 'category'],
 *     sort: { key: 'price', direction: 'asc', type: 'numeric' },
 *   })
 *
 *   // Change sort at runtime:
 *   setSort({ key: 'name', direction: 'desc' })
 *   setSort(null) // remove sorting
 */
export function useSearch<T extends Record<string, unknown>>(
    items: T[],
    options: UseSearchOptions<T>,
) {
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState<SortConfig<T> | null>(options.sort ?? null)
    const {keys, caseSensitive = false} = options

    const filtered = useMemo(() => {
        let result = items

        // Filter
        const trimmed = query.trim()
        if (trimmed) {
            const search = caseSensitive ? trimmed : trimmed.toLowerCase()
            result = result.filter((item) =>
                keys.some((key) => {
                    const value = item[key]
                    if (value == null) return false
                    const str = String(value)
                    return (caseSensitive ? str : str.toLowerCase()).includes(search)
                }),
            )
        }

        // Sort
        if (sort) {
            const {key, direction = 'asc'} = sort
            const sortType = sort.type ?? detectSortType(result.find((item) => item[key] != null)?.[key])
            const dir = direction === 'desc' ? -1 : 1

            result = [...result].sort((a, b) => dir * compareValues(a[key], b[key], sortType))
        }

        return result
    }, [items, query, keys, caseSensitive, sort])

    return {query, setQuery, filtered, resultCount: filtered.length, sort, setSort}
}
