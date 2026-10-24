import {supabaseAdmin} from '@/lib/supabase/server'
import type {BuildingRole} from '@workspace/shared'

export interface Membership {
    building_id: string
    role: BuildingRole
    unit_id: string | null
}

/**
 * A user belongs to at most one building in this MVP (building_members.user_id
 * is UNIQUE), so this is always a single row, not a list.
 */
export async function getMembership(userId: string): Promise<Membership | null> {
    const {data} = await supabaseAdmin
        .from('building_members')
        .select('building_id, role, unit_id')
        .eq('user_id', userId)
        .maybeSingle()

    return data ?? null
}

export async function requireAdmin(userId: string): Promise<Membership | null> {
    const membership = await getMembership(userId)
    if (!membership || membership.role !== 'admin') return null
    return membership
}
