'use client'

import * as React from 'react'
import {Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle} from '@/components/modal/modal'
import {Button} from '@workspace/ui/ui/button'
import {Input} from '@workspace/ui/ui/input'
import {Textarea} from '@workspace/ui/ui/textarea'
import {Label} from '@workspace/ui/ui/label'
import {cn} from '@/lib/utils'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {AlertTriangle, CheckCircle2, Info, XCircle} from 'lucide-react'

// ---------------------------------------------------------------------------
// Shared field types
// ---------------------------------------------------------------------------

export interface ModalField {
    /** Unique key for this field */
    name: string
    /** Display label */
    label: string
    /** Input type (default: 'text') */
    type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'textarea'
    /** Placeholder text */
    placeholder?: string
    /** Whether the field is required (default: false) */
    required?: boolean
    /** Default value */
    defaultValue?: string
    /** Custom validation function — return error message or undefined */
    validate?: (value: string) => string | undefined
}

// ---------------------------------------------------------------------------
// FormModal — modal with validated form fields
// ---------------------------------------------------------------------------

export interface FormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (values: Record<string, string>) => void | Promise<void>
    title: string
    description?: string
    fields: ModalField[]
    submitLabel?: string
    cancelLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function FormModal({
                              open,
                              onClose,
                              onSubmit,
                              title,
                              description,
                              fields,
                              submitLabel,
                              cancelLabel,
                              size = 'md',
                          }: FormModalProps) {
    const {t} = useI18n()
    const resolvedSubmitLabel = submitLabel ?? t.common.submit
    const resolvedCancelLabel = cancelLabel ?? t.common.cancel
    const [values, setValues] = React.useState<Record<string, string>>({})
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [submitting, setSubmitting] = React.useState(false)
    const textareaRefs = React.useRef<Record<string, HTMLTextAreaElement | null>>({})

    // Initialize defaults when opening
    React.useEffect(() => {
        if (open) {
            const defaults: Record<string, string> = {}
            for (const field of fields) {
                defaults[field.name] = field.defaultValue || ''
            }
            setValues(defaults)
            setErrors({})
            setSubmitting(false)

            setTimeout(() => {
                for (const field of fields) {
                    if (field.type === 'textarea') {
                        autoResize(field.name)
                    }
                }
            }, 0)
        }
    }, [open, fields])

    function autoResize(name: string) {
        const el = textareaRefs.current[name]
        if (!el) return

        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }

    function handleChange(name: string, value: string) {
        setValues((prev) => ({...prev, [name]: value}))
        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => {
                const next = {...prev}
                delete next[name]
                return next
            })
        }
    }

    function validate(): boolean {
        const newErrors: Record<string, string> = {}

        for (const field of fields) {
            const value = (values[field.name] || '').trim()

            if (field.required && !value) {
                newErrors[field.name] = tFormat(t.modal.fieldRequired, {field: field.label})
                continue
            }

            if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[field.name] = t.modal.invalidEmail
                continue
            }

            if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
                newErrors[field.name] = t.modal.invalidUrl
                continue
            }

            if (field.validate) {
                const customError = field.validate(value)
                if (customError) {
                    newErrors[field.name] = customError
                    continue
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        setSubmitting(true)
        try {
            await onSubmit(values)
            onClose()
        } catch {
            setSubmitting(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} size={size}>
            <form onSubmit={handleSubmit}>
                <ModalHeader>
                    <ModalTitle>{title}</ModalTitle>
                    {description && <ModalDescription>{description}</ModalDescription>}
                </ModalHeader>
                <ModalBody className="space-y-4">
                    {fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={`modal-field-${field.name}`}>
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {field.type === 'textarea' ? (
                                <Textarea
                                    ref={(el) => {
                                        textareaRefs.current[field.name] = el
                                    }}
                                    id={`modal-field-${field.name}`}
                                    placeholder={field.placeholder}
                                    value={values[field.name] || ''}
                                    onChange={(e) => {
                                        handleChange(field.name, e.target.value)
                                        autoResize(field.name)
                                    }}
                                    rows={1}
                                    className={cn(
                                        'resize-none overflow-hidden',
                                        errors[field.name] && 'border-destructive focus-visible:ring-destructive'
                                    )}
                                />
                            ) : (
                                <Input
                                    id={`modal-field-${field.name}`}
                                    type={field.type || 'text'}
                                    placeholder={field.placeholder}
                                    value={values[field.name] || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className={cn(errors[field.name] && 'border-destructive focus-visible:ring-destructive')}
                                />
                            )}
                            {errors[field.name] && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <XCircle className="h-3 w-3 shrink-0"/>
                                    {errors[field.name]}
                                </p>
                            )}
                        </div>
                    ))}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                        {resolvedCancelLabel}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? t.common.submitting : resolvedSubmitLabel}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    )
}

FormModal.displayName = 'FormModal'

// ---------------------------------------------------------------------------
// InfoModal — simple informational display
// ---------------------------------------------------------------------------

export interface InfoModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    children?: React.ReactNode
    buttonLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function InfoModal({
                              open,
                              onClose,
                              title,
                              description,
                              children,
                              buttonLabel,
                              size = 'sm',
                          }: InfoModalProps) {
    const {t} = useI18n()
    return (
        <Modal open={open} onClose={onClose} size={size}>
            <ModalHeader className="text-center pt-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Info className="h-6 w-6 text-primary"/>
                </div>
                <ModalTitle>{title}</ModalTitle>
                {description && <ModalDescription>{description}</ModalDescription>}
            </ModalHeader>
            {children && <ModalBody>{children}</ModalBody>}
            <ModalFooter className="sm:justify-center">
                <Button onClick={onClose}>{buttonLabel ?? t.common.gotIt}</Button>
            </ModalFooter>
        </Modal>
    )
}

InfoModal.displayName = 'InfoModal'

// ---------------------------------------------------------------------------
// SuccessModal — success state display
// ---------------------------------------------------------------------------

export interface SuccessModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    buttonLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function SuccessModal({
                                 open,
                                 onClose,
                                 title,
                                 description,
                                 buttonLabel,
                                 size = 'sm',
                             }: SuccessModalProps) {
    const {t} = useI18n()
    return (
        <Modal open={open} onClose={onClose} size={size}>
            <ModalHeader className="text-center pt-8">
                <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                    <CheckCircle2 className="h-6 w-6 text-success"/>
                </div>
                <ModalTitle>{title}</ModalTitle>
                {description && <ModalDescription>{description}</ModalDescription>}
            </ModalHeader>
            <ModalFooter className="sm:justify-center">
                <Button onClick={onClose}>{buttonLabel ?? t.common.done}</Button>
            </ModalFooter>
        </Modal>
    )
}

SuccessModal.displayName = 'SuccessModal'

// ---------------------------------------------------------------------------
// ErrorModal — error state display
// ---------------------------------------------------------------------------

export interface ErrorModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
    buttonLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ErrorModal({
                               open,
                               onClose,
                               title,
                               description,
                               buttonLabel,
                               size = 'sm',
                           }: ErrorModalProps) {
    const {t} = useI18n()
    return (
        <Modal open={open} onClose={onClose} size={size}>
            <ModalHeader className="text-center pt-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive"/>
                </div>
                <ModalTitle>{title}</ModalTitle>
                {description && <ModalDescription>{description}</ModalDescription>}
            </ModalHeader>
            <ModalFooter className="sm:justify-center">
                <Button variant="outline" onClick={onClose}>{buttonLabel ?? t.common.close}</Button>
            </ModalFooter>
        </Modal>
    )
}

ErrorModal.displayName = 'ErrorModal'

// ---------------------------------------------------------------------------
// ConfirmModal — confirmation with destructive option
// ---------------------------------------------------------------------------

export interface ConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ConfirmModal({
                                 open,
                                 onClose,
                                 onConfirm,
                                 title,
                                 description,
                                 confirmLabel,
                                 cancelLabel,
                                 variant = 'default',
                                 size = 'sm',
                             }: ConfirmModalProps) {
    const {t} = useI18n()
    const resolvedConfirmLabel = confirmLabel ?? t.common.confirm
    const resolvedCancelLabel = cancelLabel ?? t.common.cancel
    const [loading, setLoading] = React.useState(false)

    async function handleConfirm() {
        setLoading(true)
        try {
            await onConfirm()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} size={size} showCloseButton={false}>
            <ModalHeader className="text-center pt-8">
                <div className={cn(
                    'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
                    variant === 'destructive'
                        ? 'bg-destructive/10'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                    <AlertTriangle className={cn(
                        'h-6 w-6',
                        variant === 'destructive'
                            ? 'text-destructive'
                            : 'text-amber-600 dark:text-amber-400'
                    )}/>
                </div>
                <ModalTitle>{title}</ModalTitle>
                {description && <ModalDescription>{description}</ModalDescription>}
            </ModalHeader>
            <ModalFooter className="sm:justify-center">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    {resolvedCancelLabel}
                </Button>
                <Button
                    variant={variant === 'destructive' ? 'destructive' : 'default'}
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? t.common.pleaseWait : resolvedConfirmLabel}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

ConfirmModal.displayName = 'ConfirmModal'
