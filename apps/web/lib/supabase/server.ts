import {createClient} from '@supabase/supabase-js'

// Same build-time-crash risk as supabaseAdmin below, for the same reason:
// this module is evaluated eagerly while Next.js collects page data, even
// for routes that never run during the build. If a deploy platform's Docker
// build doesn't forward these as build args, createClient(undefined, ...)
// throws and kills the entire build, not just the route that would've used
// it. The dummy fallback only covers that build-time evaluation window —
// the real values are always present at request time (unlike the client
// bundle's copy of these vars, which really would ship broken if missing,
// so lib/supabase/client.ts deliberately has no such fallback).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build'

export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
})

// Admin client — bypasses RLS. Only use server-side.
// SUPABASE_SERVICE_ROLE_KEY isn't a NEXT_PUBLIC_ var, so Turborepo's strict
// env mode hides it from the build process on Vercel unless declared in
// turbo.json's globalEnv — and since this module is evaluated eagerly
// (Next.js loads route modules while collecting page data, even for fully
// dynamic routes), a missing key crashes the whole build at module
// evaluation, not just the request that would've used it. The real key is
// always present at runtime; this placeholder only covers that build-time
// evaluation window.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key-for-build'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
})
