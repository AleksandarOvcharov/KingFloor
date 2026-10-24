import * as React from 'react'
import {ChevronLeft, ChevronRight, MoreHorizontal} from 'lucide-react'
import {cn} from '@workspace/ui/lib/utils'
import {type ButtonProps, buttonVariants} from '@workspace/ui/ui/button'

const Pagination = ({className, ...props}: React.ComponentProps<'nav'>) => (
    <nav role="navigation" aria-label="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...props}/>
)
Pagination.displayName = 'Pagination'

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
    ({className, ...props}, ref) => (
        <ul ref={ref} className={cn('flex flex-row flex-wrap items-center justify-center gap-1', className)} {...props}/>
    ),
)
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
    ({className, ...props}, ref) => (
        <li ref={ref} className={cn('', className)} {...props}/>
    ),
)
PaginationItem.displayName = 'PaginationItem'

type PaginationLinkProps = {
    isActive?: boolean
} & Pick<ButtonProps, 'size'> &
    React.ComponentProps<'a'>

const PaginationLink = ({className, isActive, size = 'icon', onClick, href, ...props}: PaginationLinkProps) => (
    <a
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
            buttonVariants({variant: isActive ? 'outline' : 'ghost', size}),
            'h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm',
            className
        )}
        onClick={(e) => {
            if (href === '#' || !href) {
                e.preventDefault()
            }
            onClick?.(e)
        }}
        {...props}
    />
)
PaginationLink.displayName = 'PaginationLink'

const PaginationPrevious = ({className, ...props}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn('gap-1 px-2.5 sm:px-3 text-xs sm:text-sm h-8 sm:h-9 w-auto', className)} {...props}>
        <ChevronLeft className="h-4 w-4"/>
        <span>Previous</span>
    </PaginationLink>
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = ({className, ...props}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink aria-label="Go to next page" size="default" className={cn('gap-1 px-2.5 sm:px-3 text-xs sm:text-sm h-8 sm:h-9 w-auto', className)} {...props}>
        <span>Next</span>
        <ChevronRight className="h-4 w-4"/>
    </PaginationLink>
)
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({className, ...props}: React.ComponentProps<'span'>) => (
    <span aria-hidden className={cn('flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center text-xs', className)} {...props}>
        <MoreHorizontal className="h-4 w-4"/>
        <span className="sr-only">More pages</span>
    </span>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export {Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis}
