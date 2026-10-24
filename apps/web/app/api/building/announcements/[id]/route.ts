import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {requireAdmin} from '@/lib/building/membership'
import {updateAnnouncementSchema} from '@workspace/shared'

/** PATCH /api/building/announcements/[id] — admin only: edit or (un)pin. */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const body = await request.json()
        const parsed = updateAnnouncementSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const updates: Record<string, string | boolean> = {}
        if (parsed.data.title !== undefined) updates.title = parsed.data.title
        if (parsed.data.body !== undefined) updates.body = parsed.data.body
        if (parsed.data.pinned !== undefined) updates.pinned = parsed.data.pinned

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({error: 'No fields to update'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        if (!data) return NextResponse.json({error: 'Announcement not found'}, {status: 404})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** DELETE /api/building/announcements/[id] — admin only. */
export async function DELETE(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id} = await params
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await requireAdmin(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Admins only'}, {status: 403})

        const {data, error} = await supabaseAdmin
            .from('announcements')
            .delete()
            .eq('id', id)
            .eq('building_id', membership.building_id)
            .select()
            .maybeSingle()

        if (error) return NextResponse.json({error: error.message}, {status: 500})
        if (!data) return NextResponse.json({error: 'Announcement not found'}, {status: 404})
        return NextResponse.json({data})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
