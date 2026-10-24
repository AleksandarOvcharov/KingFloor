import {createClient} from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
