import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'
import {getMembership} from '@/lib/building/membership'
import {createChatMessageSchema} from '@workspace/shared'
import type {BuildingChatMessage} from '@workspace/shared'

const PAGE_SIZE = 100

/** GET /api/building/chat — any member, last 100 messages oldest-first. */
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const {data: messages, error} = await supabaseAdmin
            .from('building_chat_messages')
            .select('*')
            .eq('building_id', membership.building_id)
            .order('created_at', {ascending: false})
            .limit(PAGE_SIZE)

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const senderIds = Array.from(new Set((messages ?? []).map((m) => m.sender_id).filter((id): id is string => !!id)))
        const {data: profiles} = senderIds.length
            ? await supabaseAdmin.from('profiles').select('id, display_name, username, avatar_url').in('id', senderIds)
            : {data: []}
        const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

        // Oldest first for rendering top-to-bottom like a chat.
        const enriched: BuildingChatMessage[] = (messages ?? [])
            .slice()
            .reverse()
            .map((m) => {
                const profile = m.sender_id ? profileById.get(m.sender_id) : undefined
                return {
                    ...m,
                    sender_name: profile?.display_name || profile?.username || null,
                    sender_avatar_url: profile?.avatar_url ?? null,
                }
            })

        return NextResponse.json({data: enriched})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}

/** POST /api/building/chat — any member can send a message. */
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const membership = await getMembership(auth.user.id)
        if (!membership) return NextResponse.json({error: 'Not part of a building'}, {status: 404})

        const body = await request.json()
        const parsed = createChatMessageSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({error: parsed.error.issues[0]?.message ?? 'Invalid input'}, {status: 400})
        }

        const {data, error} = await supabaseAdmin
            .from('building_chat_messages')
            .insert({
                building_id: membership.building_id,
                sender_id: auth.user.id,
                body: parsed.data.body,
            })
            .select()
            .single()

        if (error) return NextResponse.json({error: error.message}, {status: 500})

        const {data: profile} = await supabaseAdmin
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('id', auth.user.id)
            .maybeSingle()

        const enriched: BuildingChatMessage = {
            ...data,
            sender_name: profile?.display_name || profile?.username || null,
            sender_avatar_url: profile?.avatar_url ?? null,
        }

        return NextResponse.json({data: enriched}, {status: 201})
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({error: message}, {status: 500})
    }
}
