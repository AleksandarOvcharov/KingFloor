'use client'

import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '@/hooks/useAuth'
import {useI18n} from '@/lib/i18n/provider'
import {Loader2} from 'lucide-react'

export default function AuthCallbackPage() {
    const {user, loading} = useAuth()
    const {t} = useI18n()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/dashboard')
            } else {
                router.replace('/login?error=auth-callback-error')
            }
        }
    }, [user, loading, router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                <p className="text-muted-foreground">{t.loading.signingIn}</p>
            </div>
        </div>
    )
}
