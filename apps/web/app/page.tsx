'use client'

import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {useProfile} from '@/hooks/useProfile'
import {Header} from '@/components/header'
import {Button} from '@workspace/ui/ui/button'
import {LoadingScreen} from '@workspace/ui/ui/global-loading'
import {useI18n, tFormat} from '@/lib/i18n/provider'
import {ArrowRight, Bot, Lock, Palette} from 'lucide-react'

export default function Home() {
    const {user, loading} = useAuth()
    const {profile, loading: profileLoading} = useProfile(user)
    const {t} = useI18n()

    if (loading || (user && profileLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingScreen message={t.common.loading} spinnerSize={36} />
            </div>
        )
    }

    return (
        <main className="min-h-screen">
            <Header/>

            <div className="container mx-auto px-4 py-10 sm:py-16">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            {t.home.title}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t.home.subtitle}
                        </p>
                    </div>

                    {!user ? (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link href="/signup">
                                <Button size="lg" className="min-w-50">
                                    {t.home.getStarted}
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="min-w-50">
                                    {t.common.login}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-10">
                                <p className="text-lg font-bold">
                                    {tFormat(t.home.welcomeBack, {name: profile?.username || user.email?.split('@')[0] || ''})}
                                </p>
                            </div>
                            <Link href="/dashboard">
                                <Button size="lg">
                                    {t.home.goToDashboard}
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </Link>
                        </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-6 pt-16">
                        <Link href="/features" className="block">
                            <div
                                className="p-6 rounded-lg border bg-card hover:border-primary transition-colors cursor-pointer h-full text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Lock className="h-5 w-5 text-primary"/>
                                    <h3 className="font-semibold">{t.home.featureAuthTitle}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t.home.featureAuthDescription}
                                </p>
                            </div>
                        </Link>
                        <Link href="/features" className="block">
                            <div
                                className="p-6 rounded-lg border bg-card hover:border-primary transition-colors cursor-pointer h-full text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Palette className="h-5 w-5 text-primary"/>
                                    <h3 className="font-semibold">{t.home.featureUiTitle}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t.home.featureUiDescription}
                                </p>
                            </div>
                        </Link>
                        <Link href="/ai" className="block">
                            <div
                                className="p-6 rounded-lg border bg-card hover:border-primary transition-colors cursor-pointer h-full text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Bot className="h-5 w-5 text-primary"/>
                                    <h3 className="font-semibold">{t.home.featureAiTitle}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t.home.featureAiDescription}
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
