'use client'

import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {useAuth} from '@/hooks/useAuth'
import {Header} from '@/components/header'
import {AuthForm} from '@/components/auth-form'
import {LoadingScreen} from '@workspace/ui/ui/global-loading'
import {useI18n} from '@/lib/i18n/provider'

export default function SignupPage() {
    const {user, loading} = useAuth()
    const {t} = useI18n()
    const router = useRouter()

    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingScreen message={t.loading.checkingAuth} spinnerSize={36} />
            </div>
        )
    }

    if (user) {
        return null
    }

    return (
        <main className="min-h-screen flex flex-col">
            <Header/>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <AuthForm mode="signup"/>
                </div>
            </div>
        </main>
    )
}
