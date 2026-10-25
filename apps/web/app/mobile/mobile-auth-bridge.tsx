'use client'

import {useEffect, useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {Loader2} from 'lucide-react'

// Supabase's OAuth redirect has to land on a stable HTTPS URL it can
// allow-list — apps/mobile's own deep link (exp://<lan-ip>:8081/--/... in
// Expo Go, hacktemplate://... in a standalone build) changes per dev
// session or build and can never be registered there directly. So
// apps/mobile/lib/oauth.ts points Supabase here instead, with the real
// deep link URL-encoded in `?to=`, and this page forwards Supabase's
// access/refresh tokens (appended to the hash fragment) on to it.
export function MobileAuthBridge() {
    const searchParams = useSearchParams()
    const [manualUrl, setManualUrl] = useState<string | null>(null)

    useEffect(() => {
        const to = searchParams.get('to')
        if (!to) return
        const target = `${to}${window.location.hash}`
        setManualUrl(target)
        window.location.replace(target)
    }, [searchParams])

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                <p className="text-muted-foreground">Taking you back to the KingFloor app…</p>
                {manualUrl && (
                    <a href={manualUrl} className="text-sm text-primary underline">
                        Tap here if nothing happens
                    </a>
                )}
            </div>
        </main>
    )
}
