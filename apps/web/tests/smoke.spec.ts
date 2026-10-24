import {test, expect, type Page} from '@playwright/test'

const ROUTES = ['/', '/dashboard', '/settings', '/ai', '/features'] as const

/**
 * Benign noise that isn't a real regression: Supabase logging out an
 * unauthenticated visitor, and browser-API probes (geolocation/speech)
 * that are expected to be unavailable/denied in a headless CI browser.
 */
const IGNORED_ERROR_PATTERNS = [
    /favicon\.ico/i,
    /AuthSessionMissingError/i,
    /Auth session missing/i,
    /geolocation/i,
    /SpeechRecognition/i,
]

function isIgnorable(text: string): boolean {
    return IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(text))
}

function collectPageErrors(page: Page): string[] {
    const errors: string[] = []

    page.on('console', msg => {
        if (msg.type() === 'error' && !isIgnorable(msg.text())) {
            errors.push(`console.error: ${msg.text()}`)
        }
    })

    page.on('pageerror', err => {
        if (!isIgnorable(err.message)) {
            errors.push(`pageerror: ${err.message}`)
        }
    })

    return errors
}

for (const route of ROUTES) {
    test(`${route} loads with no console/hydration errors`, async ({page}) => {
        const errors = collectPageErrors(page)

        const response = await page.goto(route, {waitUntil: 'networkidle'})

        expect(response?.status()).toBe(200)

        // Let any deferred client-side effects (auth check, redirects) settle.
        await page.waitForLoadState('networkidle')

        expect(errors, `Unexpected console/page errors on ${route}:\n${errors.join('\n')}`).toEqual([])
    })
}
