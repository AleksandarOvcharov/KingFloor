'use client'

import * as React from 'react'
import {OTPInput, OTPInputContext} from 'input-otp'
import {Minus} from 'lucide-react'
import {cn} from '@workspace/ui/lib/utils'

const InputOTP = React.forwardRef<
    React.ElementRef<typeof OTPInput>,
    React.ComponentPropsWithoutRef<typeof OTPInput>
>(({className, containerClassName, ...props}, ref) => (
    <OTPInput
        ref={ref}
        containerClassName={cn('flex items-center gap-1 sm:gap-2 has-disabled:opacity-50 max-w-full overflow-x-auto no-scrollbar', containerClassName)}
        className={cn('disabled:cursor-not-allowed', className)}
        {...props}
    />
))
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({className, ...props}, ref) => (
        <div ref={ref} className={cn('flex items-center', className)} {...props}/>
    ),
)
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({index, className, ...props}, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const {char, hasFakeCaret, isActive} = inputOTPContext.slots[index]

    return (
        <div
            ref={ref}
            className={cn(
                'relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center border-y border-r border-input text-xs sm:text-sm shadow-2xs transition-all first:rounded-l-md border-l first:border-l last:rounded-r-md',
                isActive && 'z-10 ring-1 ring-ring',
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000"/>
                </div>
            )}
        </div>
    )
})
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    ({...props}, ref) => (
        <div ref={ref} role="separator" className="px-0.5 sm:px-1" {...props}>
            <Minus className="h-3 w-3 sm:h-4 sm:w-4"/>
        </div>
    ),
)
InputOTPSeparator.displayName = 'InputOTPSeparator'

export {InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator}
