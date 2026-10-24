'use client'

import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {Header} from '@/components/header'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Badge} from '@workspace/ui/ui/badge'
import {useI18n} from '@/lib/i18n/provider'
import {ArrowRight, BookOpen, Code, Layers, Lock, Sparkles, Zap} from 'lucide-react'

export default function About() {
    const {user} = useAuth()
    const {t} = useI18n()

    return (
        <main className="min-h-screen">
            <Header/>

            <div className="container mx-auto px-4 py-8 sm:py-16">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3"/> {t.about.badge}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                            {t.about.title}
                        </h1>
                        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                            {t.about.subtitle}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <Zap className="h-8 w-8 text-primary mb-2"/>
                                <CardTitle>{t.about.whyTitle}</CardTitle>
                                <CardDescription>{t.about.whyDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>{t.about.whyParagraph1}</p>
                                <p>{t.about.whyParagraph2}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Layers className="h-8 w-8 text-primary mb-2"/>
                                <CardTitle>{t.about.stackTitle}</CardTitle>
                                <CardDescription>{t.about.stackDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                                        <strong>Next.js 16</strong> — {t.about.stackNextjs}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                                        <strong>Supabase</strong> — {t.about.stackSupabase}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                                        <strong>shadcn/ui</strong> — {t.about.stackShadcn}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                                        <strong>TailwindCSS v4</strong> — {t.about.stackTailwind}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary"/>
                                        <strong>Lucide Icons</strong> — {t.about.stackLucide}
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Lock className="h-8 w-8 text-primary mb-2"/>
                                <CardTitle>{t.about.authTitle}</CardTitle>
                                <CardDescription>{t.about.authDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    {t.about.authParagraph1Pre}
                                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">useAuth</code>
                                    {t.about.authParagraph1Post}
                                </p>
                                <p>{t.about.authParagraph2}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Code className="h-8 w-8 text-primary mb-2"/>
                                <CardTitle>{t.about.archTitle}</CardTitle>
                                <CardDescription>{t.about.archDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>{t.about.archParagraph1}</p>
                                <p>{t.about.archParagraph2}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{t.about.tipsTitle}</h2>
                            <p className="text-muted-foreground mt-1">{t.about.tipsSubtitle}</p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <Card className="text-center p-6">
                                <div className="text-3xl font-bold text-primary mb-2">01</div>
                                <h3 className="font-semibold mb-1">{t.about.tip1Title}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {t.about.tip1Description}
                                </p>
                            </Card>
                            <Card className="text-center p-6">
                                <div className="text-3xl font-bold text-primary mb-2">02</div>
                                <h3 className="font-semibold mb-1">{t.about.tip2Title}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {t.about.tip2DescriptionPre}<code
                                    className="font-mono text-xs bg-muted px-1 py-0.5 rounded">@workspace/ui</code>{t.about.tip2DescriptionPost}
                                </p>
                            </Card>
                            <Card className="text-center p-6">
                                <div className="text-3xl font-bold text-primary mb-2">03</div>
                                <h3 className="font-semibold mb-1">{t.about.tip3Title}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {t.about.tip3Description}
                                </p>
                            </Card>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-muted/50 p-6 sm:p-8 space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary"/> {t.about.quickStartTitle}
                        </h2>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>{t.about.step1Pre}<code
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">pnpm install</code></p>
                            <p>{t.about.step2Pre}<code
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">.env.example</code>{t.about.step2Mid}<code
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">.env.local</code>{t.about.step2Post}</p>
                            <p>{t.about.step3Pre}<code
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">database/</code></p>
                            <p>{t.about.step4Pre}<code
                                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">pnpm dev</code></p>
                            <p>{t.about.step5}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <Button asChild size="lg" className="gap-2">
                            <Link href={user ? '/dashboard' : '/signup'}>
                                {user ? t.home.goToDashboard : t.home.getStarted} <ArrowRight className="h-4 w-4"/>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
