import {NextRequest, NextResponse} from 'next/server'
import {supabaseServer} from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const {error} = await supabaseServer.auth.signOut()

        if (error) {
            return NextResponse.json({error: error.message}, {status: 400})
        }

        return NextResponse.json({message: 'Logged out successfully'}, {status: 200})
    } catch (error) {
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        )
    }
}
