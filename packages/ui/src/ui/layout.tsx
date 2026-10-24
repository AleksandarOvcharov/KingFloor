import * as React from 'react'
import {cn} from '@workspace/ui/lib/utils'

/**
 * Responsive container with max-width and horizontal padding.
 */
const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'}>(
    ({size = 'lg', className, ...props}, ref) => (
        <div
            ref={ref}
            className={cn(
                'mx-auto w-full px-4 sm:px-6 lg:px-8',
                size === 'sm' && 'max-w-2xl',
                size === 'md' && 'max-w-4xl',
                size === 'lg' && 'max-w-6xl',
                size === 'xl' && 'max-w-7xl',
                size === 'full' && 'max-w-full',
                className,
            )}
            {...props}
        />
    ),
)
Container.displayName = 'Container'

/**
 * Flex row with responsive stacking (column on mobile, row on md+).
 */
const Row = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {gap?: 'sm' | 'md' | 'lg'}>(
    ({gap = 'md', className, ...props}, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-col md:flex-row',
                gap === 'sm' && 'gap-2 md:gap-3',
                gap === 'md' && 'gap-4 md:gap-6',
                gap === 'lg' && 'gap-6 md:gap-8',
                className,
            )}
            {...props}
        />
    ),
)
Row.displayName = 'Row'

/**
 * Responsive grid with auto-fit columns.
 *
 * Accepts a simple number or a responsive object:
 *   <Grid cols={3} />                           -- classic (built-in responsive)
 *   <Grid cols={{sm: 1, md: 2, lg: 3}} />       -- explicit per-breakpoint control
 *   <Grid cols={{sm: 1, lg: 4}} />               -- partial — unset breakpoints stay 1
 */
type ColCount = 1 | 2 | 3 | 4
type ResponsiveCols = {sm?: ColCount; md?: ColCount; lg?: ColCount; xl?: ColCount}

const colClasses: Record<string, Record<ColCount, string>> = {
    sm: {1: 'grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4'},
    md: {1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4'},
    lg: {1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4'},
    xl: {1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4'},
}

function resolveColClasses(cols: ColCount | ResponsiveCols): string {
    if (typeof cols === 'number') {
        // Legacy behaviour — sensible responsive defaults
        if (cols === 1) return 'grid-cols-1'
        if (cols === 2) return 'grid-cols-1 sm:grid-cols-2'
        if (cols === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    }

    const classes = ['grid-cols-1']
    for (const bp of ['sm', 'md', 'lg', 'xl'] as const) {
        const val = cols[bp]
        if (val) classes.push(colClasses[bp][val])
    }
    return classes.join(' ')
}

const Grid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {cols?: ColCount | ResponsiveCols; gap?: 'sm' | 'md' | 'lg'}>(
    ({cols = 3, gap = 'md', className, ...props}, ref) => (
        <div
            ref={ref}
            className={cn(
                'grid',
                resolveColClasses(cols),
                gap === 'sm' && 'gap-3',
                gap === 'md' && 'gap-6',
                gap === 'lg' && 'gap-8',
                className,
            )}
            {...props}
        />
    ),
)
Grid.displayName = 'Grid'

/**
 * Center content both horizontally and vertically.
 */
const Center = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({className, ...props}, ref) => (
        <div ref={ref} className={cn('flex items-center justify-center', className)} {...props}/>
    ),
)
Center.displayName = 'Center'

/**
 * Flex with space between, useful for headers/toolbars.
 */
const SpaceBetween = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({className, ...props}, ref) => (
        <div ref={ref} className={cn('flex items-center justify-between gap-4', className)} {...props}/>
    ),
)
SpaceBetween.displayName = 'SpaceBetween'

/**
 * Stack children vertically with consistent spacing.
 */
const Stack = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {gap?: 'sm' | 'md' | 'lg'}>(
    ({gap = 'md', className, ...props}, ref) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-col',
                gap === 'sm' && 'gap-2',
                gap === 'md' && 'gap-4',
                gap === 'lg' && 'gap-6',
                className,
            )}
            {...props}
        />
    ),
)
Stack.displayName = 'Stack'

export {Container, Row, Grid, Center, SpaceBetween, Stack}
