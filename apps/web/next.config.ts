import type {NextConfig} from 'next'

const securityHeaders = [
    {key: 'X-Frame-Options', value: 'DENY'},
    {key: 'X-Content-Type-Options', value: 'nosniff'},
    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
    {key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self)'},
    {key: 'X-DNS-Prefetch-Control', value: 'on'},
]

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    output: 'standalone',
    // @workspace/shared and @workspace/ui ship raw TypeScript (no build
    // step), so Next needs to run them through its own compiler like any
    // other app source file — by default it only does this for
    // node_modules packages listed here.
    transpilePackages: ['@workspace/shared', '@workspace/ui'],
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
}

export default nextConfig
