'use client'

import * as React from 'react'
import {Search, X} from 'lucide-react'
import {cn} from '@workspace/ui/lib/utils'
import {Input} from '@workspace/ui/ui/input'

interface SearchFilterProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: string
    onValueChange?: (value: string) => void
    /** Debounce delay in ms. Set to 0 for instant. Default: 200 */
    debounce?: number
}

const SearchFilter = React.forwardRef<HTMLInputElement, SearchFilterProps>(
    ({value: controlledValue, onValueChange, debounce = 200, className, placeholder = 'Search...', ...props}, ref) => {
        const [internal, setInternal] = React.useState(controlledValue ?? '')
        const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null)
        const isControlled = controlledValue !== undefined

        const currentValue = isControlled ? controlledValue : internal

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = e.target.value
            if (!isControlled) setInternal(next)

            if (timerRef.current) clearTimeout(timerRef.current)

            if (debounce === 0) {
                onValueChange?.(next)
            } else {
                timerRef.current = setTimeout(() => onValueChange?.(next), debounce)
            }
        }

        const handleClear = () => {
            if (!isControlled) setInternal('')
            onValueChange?.('')
            if (timerRef.current) clearTimeout(timerRef.current)
        }

        React.useEffect(() => {
            return () => {
                if (timerRef.current) clearTimeout(timerRef.current)
            }
        }, [])

        return (
            <div className={cn('relative', className)}>
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>
                <Input
                    ref={ref}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="pl-8 pr-8"
                    role="searchbox"
                    aria-label={typeof placeholder === 'string' ? placeholder : 'Search'}
                    {...props}
                />
                {currentValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5"/>
                        <span className="sr-only">Clear search</span>
                    </button>
                )}
            </div>
        )
    },
)
SearchFilter.displayName = 'SearchFilter'

export {SearchFilter}
