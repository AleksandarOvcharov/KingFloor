import {NextRequest, NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase/server'
import {authenticateRequest} from '@/lib/api/auth'

export async function DELETE(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if ('error' in auth) return auth.error

        const userId = auth.user.id

        // Delete user data in order (respecting foreign keys):
        // 1. Analytics events
        await supabaseAdmin
            .from('analytics_events')
            .delete()
            .eq('user_id', userId)

        // 2. Chat messages (via conversations)
        const {data: conversations} = await supabaseAdmin
            .from('chat_conversations')
            .select('id')
            .eq('user_id', userId)

        if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map((c) => c.id)
            await supabaseAdmin
                .from('chat_messages')
                .delete()
                .in('conversation_id', conversationIds)
        }

        // 3. Chat conversations
        await supabaseAdmin
            .from('chat_conversations')
            .delete()
            .eq('user_id', userId)

        // 4. Delete avatar files from storage
        const {data: avatarFiles} = await supabaseAdmin.storage
            .from('avatars')
            .list(userId)

        if (avatarFiles && avatarFiles.length > 0) {
            const filePaths = avatarFiles.map((f) => `${userId}/${f.name}`)
            await supabaseAdmin.storage
                .from('avatars')
                .remove(filePaths)
        }

        // 5. Profile (cascade from auth.users would handle this, but be explicit)
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        // 6. Delete the auth user itself
        const {error: deleteError} = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            return NextResponse.json({error: deleteError.message}, {status: 500})
        }

        return NextResponse.json({message: 'Account deleted successfully'}, {status: 200})
    } catch (error) {
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500},
        )
    }
}
