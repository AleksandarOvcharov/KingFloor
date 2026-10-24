'use client'

import {useState} from 'react'
import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {useToast} from '@/hooks/useToast'
import {EmailConfirmationModal} from '@/components/email-confirmation-modal'
import {Button} from '@workspace/ui/ui/button'
import {Input} from '@workspace/ui/ui/input'
import {Label} from '@workspace/ui/ui/label'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {InlineLoader} from '@workspace/ui/ui/global-loading'
import {useI18n} from '@/lib/i18n/provider'

interface AuthFormProps {
    mode?: 'login' | 'signup'
}

export function AuthForm({mode = 'login'}: AuthFormProps) {
    const isLogin = mode === 'login'
    const {t} = useI18n()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [githubLoading, setGithubLoading] = useState(false)
    const {login, signup, signInWithGoogle, signInWithGitHub} = useAuth()
    const {addToast} = useToast()

    const isAnyLoading = loading || googleLoading || githubLoading

    const handleGoogleSignIn = async () => {
        if (isAnyLoading) return
        setGoogleLoading(true)
        const {error} = await signInWithGoogle()
        if (error) {
            setGoogleLoading(false)
            addToast({
                title: t.auth.error,
                description: error.message,
                variant: 'error',
            })
        }
    }

    const handleGitHubSignIn = async () => {
        if (isAnyLoading) return
        setGithubLoading(true)
        const {error} = await signInWithGitHub()
        if (error) {
            setGithubLoading(false)
            addToast({
                title: t.auth.error,
                description: error.message,
                variant: 'error',
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isAnyLoading) return

        const cleanEmail = email.trim().toLowerCase()
        if (!cleanEmail || !password) {
            setError(t.auth.fillBothFields)
            return
        }

        setError('')
        setLoading(true)

        try {
            const {error} = isLogin
                ? await login(cleanEmail, password)
                : await signup(cleanEmail, password)

            if (error) {
                setError(error.message)
                addToast({
                    title: t.auth.error,
                    description: error.message,
                    variant: 'error',
                })
            } else {
                if (isLogin) {
                    addToast({
                        title: t.auth.welcomeBackToast,
                        description: t.auth.loggedInSuccess,
                        variant: 'success',
                    })
                } else {
                    setShowEmailModal(true)
                }
            }
        } catch {
            setError(t.auth.unexpectedError)
            addToast({
                title: t.auth.error,
                description: t.auth.unexpectedError,
                variant: 'error',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {showEmailModal && (
                <EmailConfirmationModal
                    email={email.trim().toLowerCase()}
                    onClose={() => setShowEmailModal(false)}
                />
            )}
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isLogin ? t.common.login : t.common.signup}</CardTitle>
                    <CardDescription>
                        {isLogin ? t.auth.loginDescription : t.auth.signupDescription}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t.auth.email}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isAnyLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t.auth.password}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isAnyLoading}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full gap-2" disabled={isAnyLoading}>
                            {loading ? (
                                <>
                                    <InlineLoader loading={true} size={16} />
                                    <span>{isLogin ? t.auth.loggingIn : t.auth.signingUp}</span>
                                </>
                            ) : (
                                isLogin ? t.common.login : t.common.signup
                            )}
                        </Button>
                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t"/>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                disabled={isAnyLoading}
                                onClick={handleGoogleSignIn}
                            >
                                {googleLoading ? t.auth.redirecting : (
                                    <>
                                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        Google
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                disabled={isAnyLoading}
                                onClick={handleGitHubSignIn}
                            >
                                {githubLoading ? t.auth.redirecting : (
                                    <>
                                        <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                                            <path
                                                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                                            />
                                        </svg>
                                        GitHub
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {isLogin ? (
                                <>
                                    {t.auth.noAccount}{' '}
                                    <Link href="/signup" className="text-primary hover:underline">
                                        {t.common.signup}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {t.auth.haveAccount}{' '}
                                    <Link href="/login" className="text-primary hover:underline">
                                        {t.common.login}
                                    </Link>
                                </>
                            )}
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </>
    )
}
