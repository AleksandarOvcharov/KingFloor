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

// =============================================================================
// KingFloor domain — mirrors validation enforced in apps/web/app/api/building/*
// =============================================================================

export const createBuildingSchema = z.object({
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().max(200).optional(),
})
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>

export const updateBuildingSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().max(200).nullable().optional(),
    iban: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{15,34}$/, 'IBAN must be 15–34 letters/digits').nullable().optional(),
})
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>

const INVITE_CODE_REGEX = /^[A-Z0-9]{6}$/i

export const lookupBuildingSchema = z.object({
    invite_code: z.string().trim().toUpperCase().regex(INVITE_CODE_REGEX, 'Invite code must be 6 characters'),
})
export type LookupBuildingInput = z.infer<typeof lookupBuildingSchema>

export const joinBuildingSchema = z.object({
    invite_code: z.string().trim().toUpperCase().regex(INVITE_CODE_REGEX, 'Invite code must be 6 characters'),
    unit_id: z.string().uuid(),
})
export type JoinBuildingInput = z.infer<typeof joinBuildingSchema>

export const createUnitSchema = z.object({
    number: z.string().trim().min(1).max(20),
    floor: z.number().int().optional().nullable(),
    area_sqm: z.number().positive().optional().nullable(),
    ideal_parts: z.number().positive().optional().nullable(),
})
export type CreateUnitInput = z.infer<typeof createUnitSchema>

export const updateUnitSchema = z.object({
    number: z.string().trim().min(1).max(20).optional(),
    floor: z.number().int().optional().nullable(),
    area_sqm: z.number().positive().optional().nullable(),
    ideal_parts: z.number().positive().optional().nullable(),
})
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>

export const addMemberSchema = z.object({
    email: z.string().trim().email(),
    unit_id: z.string().uuid(),
    role: z.enum(['admin', 'resident']).default('resident'),
})
export type AddMemberInput = z.infer<typeof addMemberSchema>

export const generateFeesSchema = z.object({
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be YYYY-MM'),
    amount_mode: z.enum(['fixed', 'per_sqm']),
    amount: z.number().positive(),
    due_date: z.string().optional().nullable(),
})
export type GenerateFeesInput = z.infer<typeof generateFeesSchema>

export const feeActionSchema = z.object({
    action: z.enum(['mark_paid', 'mark_unpaid']),
    // Must stay in sync with the only two values finance-summary's cash/online
    // split actually recognizes ('cash' vs. everything else bucketed as
    // online) — an unconstrained string here let any value through and have
    // it silently miscounted as online income.
    method: z.enum(['cash', 'bank_transfer']).optional(),
    note: z.string().trim().max(200).optional(),
})
export type FeeActionInput = z.infer<typeof feeActionSchema>

export const createAnnouncementSchema = z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
    pinned: z.boolean().optional().default(false),
})
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>

export const updateAnnouncementSchema = z.object({
    title: z.string().trim().min(1).max(120).optional(),
    body: z.string().trim().min(1).max(4000).optional(),
    pinned: z.boolean().optional(),
})
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>

const pollOptionInputSchema = z.object({
    label: z.string().trim().min(1).max(100),
    attachment_url: z.string().trim().url().optional().nullable(),
    attachment_name: z.string().trim().max(200).optional().nullable(),
})

export const createPollSchema = z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    closes_at: z.string().optional().nullable(),
    options: z.array(pollOptionInputSchema).min(2).max(8),
})
export type CreatePollInput = z.infer<typeof createPollSchema>

export const castVoteSchema = z.object({
    option_id: z.string().uuid(),
})
export type CastVoteInput = z.infer<typeof castVoteSchema>

export const createIssueSchema = z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    unit_id: z.string().uuid().optional().nullable(),
    priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
})
export type CreateIssueInput = z.infer<typeof createIssueSchema>

export const updateIssueStatusSchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved']),
})
export type UpdateIssueStatusInput = z.infer<typeof updateIssueStatusSchema>

export const createIssueCommentSchema = z.object({
    body: z.string().trim().min(1).max(1000),
})
export type CreateIssueCommentInput = z.infer<typeof createIssueCommentSchema>

export const createExpenseSchema = z.object({
    category: z.string().trim().min(1).max(60),
    description: z.string().trim().max(500).optional(),
    amount: z.number().positive(),
    spent_at: z.string().optional(), // 'YYYY-MM-DD', defaults to today server-side
})
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
