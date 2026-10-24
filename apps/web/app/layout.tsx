import type {Metadata} from 'next'
import {cookies} from 'next/headers'
import {Inter} from 'next/font/google'
import {ToastProvider} from '@/components/toast'
import {NotificationProvider} from '@/components/notification'
import {AppErrorBoundary} from '@/components/app-error-boundary'
import {SmoothScrollProvider} from '@/components/smooth-scroll-provider'
import {I18nProvider} from '@/lib/i18n/provider'
import {LOCALE_COOKIE, isLocale} from '@/lib/i18n/dictionaries'
import 'lenis/dist/lenis.css'
import 'leaflet/dist/leaflet.css'
import './globals.css'

const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
    title: 'Hackathon Startup Template',
    description: 'A minimal Next.js template for hackathons with Supabase auth',
}

// Theme and colorblind-mode still read localStorage (no SSR source for
// them), applied before paint to avoid a flash. Locale is resolved
// server-side instead (see below) — it's rendered into the HTML directly,
// so there's nothing left for this script to do for it.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}if(localStorage.getItem('colorblind-mode')==='true'){document.documentElement.classList.add('colorblind')}}catch(e){}})()`

export default async function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value
    const locale = isLocale(localeCookie) ? localeCookie : 'en'

    return (
        <html lang={locale} suppressHydrationWarning>
        <head>
            <title>Hackathon Startup Template</title>
            <script dangerouslySetInnerHTML={{__html: themeScript}}/>
        </head>
        <body className={inter.className}>
        <I18nProvider initialLocale={locale}>
            <ToastProvider>
                <NotificationProvider>
                    <AppErrorBoundary>
                        <SmoothScrollProvider>
                            {children}
                        </SmoothScrollProvider>
                    </AppErrorBoundary>
                </NotificationProvider>
            </ToastProvider>
        </I18nProvider>
        </body>
        </html>
    )
}
