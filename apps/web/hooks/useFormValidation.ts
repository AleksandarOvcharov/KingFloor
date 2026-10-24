'use client'

import {useState, useCallback} from 'react'

type Validator = (value: string) => string | undefined

interface FieldConfig {
    required?: boolean
    label?: string
    validate?: Validator
}

type FieldErrors<T extends string> = Partial<Record<T, string>>
type FieldValues<T extends string> = Record<T, string>
type FieldConfigs<T extends string> = Record<T, FieldConfig>

/**
 * Lightweight form validation hook.
 *
 * Usage:
 *   const form = useFormValidation({
 *     email: { required: true, label: 'Email', validate: (v) => !v.includes('@') ? 'Invalid email' : undefined },
 *     password: { required: true, label: 'Password', validate: (v) => v.length < 6 ? 'Too short' : undefined },
 *   })
 *
 *   <Input value={form.values.email} onChange={(e) => form.setValue('email', e.target.value)} />
 *   {form.errors.email && <p className="text-destructive text-sm">{form.errors.email}</p>}
 *   <Button onClick={() => { if (form.validateAll()) handleSubmit(form.values) }}>Submit</Button>
 */
export function useFormValidation<T extends string>(fields: FieldConfigs<T>) {
    const fieldNames = Object.keys(fields) as T[]
    const initialValues = Object.fromEntries(fieldNames.map((k) => [k, ''])) as FieldValues<T>

    const [values, setValues] = useState<FieldValues<T>>(initialValues)
    const [errors, setErrors] = useState<FieldErrors<T>>({})
    const [touched, setTouched] = useState<Partial<Record<T, boolean>>>({})

    const validateField = useCallback((name: T, value: string): string | undefined => {
        const config = fields[name]
        if (config.required && !value.trim()) {
            return `${config.label ?? name} is required`
        }
        return config.validate?.(value)
    }, [fields])

    const setValue = useCallback((name: T, value: string) => {
        setValues((prev) => ({...prev, [name]: value}))
        if (touched[name]) {
            const error = validateField(name, value)
            setErrors((prev) => ({...prev, [name]: error}))
        }
    }, [touched, validateField])

    const setFieldTouched = useCallback((name: T) => {
        setTouched((prev) => ({...prev, [name]: true}))
        const error = validateField(name, values[name])
        setErrors((prev) => ({...prev, [name]: error}))
    }, [validateField, values])

    const validateAll = useCallback((): boolean => {
        const nextErrors: FieldErrors<T> = {}
        const nextTouched: Partial<Record<T, boolean>> = {}
        let valid = true

        for (const name of fieldNames) {
            nextTouched[name] = true
            const error = validateField(name, values[name])
            if (error) {
                nextErrors[name] = error
                valid = false
            }
        }

        setErrors(nextErrors)
        setTouched(nextTouched)
        return valid
    }, [fieldNames, validateField, values])

    const reset = useCallback(() => {
        setValues(initialValues)
        setErrors({})
        setTouched({})
    }, [initialValues])

    const hasErrors = Object.values(errors).some(Boolean)

    return {
        values,
        errors,
        touched,
        hasErrors,
        setValue,
        setFieldTouched,
        validateAll,
        reset,
    }
}
