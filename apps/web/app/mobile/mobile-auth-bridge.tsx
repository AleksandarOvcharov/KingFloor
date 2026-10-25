'use client'

import {useEffect, useState} from 'react'
import {Loader2, Smartphone} from 'lucide-react'

// Supabase's OAuth redirect has to land on a stable HTTPS URL it can
// allow-list — apps/mobile's own deep link (exp://<lan-ip>:8081/--/... in
// Expo Go, hacktemplate://... in a standalone build) changes per dev
// session or build and can never be registered there directly. So
// apps/mobile/lib/oauth.ts points Supabase here instead, with the real
// deep link URL-encoded in `?to=`, and this page forwards Supabase's
// access/refresh tokens (appended to the hash fragment) on to it.
//
// Reads window.location directly instead of useSearchParams()/the `to`
// query param alone — the access/refresh tokens live in the hash fragment,
// which never reaches the server, so this has to run client-side anyway.
// That also sidesteps useSearchParams()'s Suspense-boundary requirement.
export function MobileAuthBridge() {
    const [target, setTarget] = useState<string | null>(null)
    const [attempted, setAttempted] = useState(false)

    useEffect(() => {
        const to = new URLSearchParams(window.location.search).get('to')
        if (!to) return
        setTarget(`${to}${window.location.hash}`)
    }, [])

    useEffect(() => {
        if (!target) return
        // Most browsers only navigate to a custom app scheme (exp://,
        // hacktemplate://) in response to a real tap — a bare JS redirect
        // fired on page load is commonly blocked as a security measure
        // (same "requires user activation" policy that stops auto-opening
        // popups). Try it anyway, since some contexts allow it (notably
        // iOS's ASWebAuthenticationSession), but don't rely on it: the
        // button below is shown immediately, not as a late fallback, so
        // there's always a one-tap way in if the silent attempt is blocked.
        window.location.replace(target)
        setAttempted(true)
    }, [target])

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-5 text-center max-w-sm">
                {target ? (
                    <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <Smartphone className="h-7 w-7 text-primary"/>
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">You&apos;re signed in</p>
                            <p className="text-sm text-muted-foreground">
                                {attempted
                                    ? "If the app didn't open automatically, tap below to continue."
                                    : 'Opening the KingFloor app…'}
                            </p>
                        </div>
                        <a
                            href={target}
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                        >
                            Open KingFloor
                        </a>
                    </>
                ) : (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                        <p className="text-muted-foreground">Finishing sign-in…</p>
                    </>
                )}
            </div>
        </main>
    )
}
