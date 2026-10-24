import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'pnpm build && pnpm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
})
