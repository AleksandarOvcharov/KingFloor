import { z } from 'zod'

// Auth — matches apps/web/components/auth-form.tsx + Supabase Auth's own
// default minimum password length (6 chars). No confirm-password field
// exists in the current flow, so login/signup share the same shape; kept
// as separate named schemas since that's likely to diverge later.
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})
export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})
export type SignupInput = z.infer<typeof signupSchema>

// Profile update — mirrors the exact validation rules enforced server-side
// in apps/web/app/api/profile/route.ts (PUT). All fields optional/nullable
// since it's a partial update. Note: the route's avatar_url check (must
// point at the configured Supabase Storage domain) is environment-aware
// and stays a runtime check in the route, not expressible here.
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/

export const profileUpdateSchema = z.object({
    username: z.string().regex(USERNAME_REGEX, 'Username must be 3–30 characters: letters, numbers, _ or - only').optional(),
    display_name: z.string().trim().max(60).nullable().optional(),
    bio: z.string().trim().max(300).nullable().optional(),
    location: z.string().trim().max(100).nullable().optional(),
    website: z.string().trim().url().nullable().optional(),
    twitter_handle: z.string().trim().max(50).transform((v) => v.replace(/^@/, '')).nullable().optional(),
    github_handle: z.string().trim().max(50).transform((v) => v.replace(/^@/, '')).nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    is_public: z.boolean().optional(),
})
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// AI generate request — matches apps/web/app/api/ai/generate/route.ts's
// Body: { prompt: string }.
export const aiGenerateSchema = z.object({
    prompt: z.string().min(1),
})
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>
