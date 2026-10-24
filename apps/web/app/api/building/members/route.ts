import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership, requireAdmin} from '@/lib/building/membership'
import {addMemberSchema} from '@workspace/shared'

/** GET /api/building/members — admin only: list all members of the building. */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data: members, error} = await supabaseAdmin
            .from('building_members')
            .select('id, building_id, user_id, role, unit_id, created_at')
            .eq('building_id', membership.building_id)

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const userIds = (members ?? []).map((m) => m.user_id)
        const unitIds = (members ?? []).map((m) => m.unit_id).filter((id): id is string => !!id)

        const [{data: profiles}, {data: units}] = await Promise.all([
            userIds.length
                ? supabaseAdmin.from('profiles').select('id, display_name, username').in('id', userIds)
                : Promise.resolve({data: []}),
            unitIds.length
                ? supabaseAdmin.from('units').select('id, number').in('id', unitIds)
                : Promise.resolve({data: []}),
        ])

        const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name || p.username]))
        const unitById = new Map((units ?? []).map((u) => [u.id, u.number]))

        const enriched = (members ?? []).map((m) => ({
            ...m,
            display_name: profileById.get(m.user_id) ?? null,
            unit_number: m.unit_id ? unitById.get(m.unit_id) ?? null : null,
        }))

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/**
 * POST /api/building/members — admin only: assign a resident (by email, must
 * already have an account) to a unit in this building.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = addMemberSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data: unit} = await supabaseAdmin
            .from('units')
            .select('id')
            .eq('id', parsed.data.unit_id)
            .eq('building_id', membership.building_id)
            .maybeSingle()
        if (!unit) return NextResponse.json({error: 'Unit not found'}, {status: 404})

        const {data: takenBy} = await supabaseAdmin
            .from('building_members')
            .select('id')
            .eq('unit_id', parsed.data.unit_id)
            .maybeSingle()
        if (takenBy) return NextResponse.json({error: 'That apartment already has a resident'}, {status: 409})

        // supabase-js's admin API has no getUserByEmail; list + filter is fine at hackathon scale.
        const {data: usersPage, error: listError} = await supabaseAdmin.auth.admin.listUsers({perPage: 1000})
        if (listError) return NextResponse.json({error: listError.message}, {status: 500})

        const targetUser = usersPage.users.find((u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase())
        if (!targetUser) {
            return NextResponse.json({error: 'No account found with that email — ask them to sign up first'}, {status: 404})
        }

        // Never silently steal someone who already belongs to a (possibly
        // different) building — upsert-on-user_id would otherwise overwrite
        // their existing membership row outright.
        const existingMembership = await getMembership(targetUser.id)
        if (existingMembership) {
            return NextResponse.json({error: 'That person already belongs to a building'}, {status: 409})
        }

        const {data, error} = await supabaseAdmin
            .from('building_members')
            .insert({
                building_id: membership.building_id,
                user_id: targetUser.id,
                role: parsed.data.role,
                unit_id: parsed.data.unit_id,
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({error: 'That apartment already has a resident — refresh and try again'}, {status: 409})
            }
            return NextResponse.json({error: error.message}, {status: 500})
        }
        return NextResponse.json({data}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
