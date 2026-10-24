import {NextRequest, NextResponse} from 'next/server'
import {supabaseServer} from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const password = typeof body.password === 'string' ? body.password : ''

        if (!email || !password) {
            return NextResponse.json(
                {error: 'Email and password are required'},
                {status: 400}
            )
        }

        const {data, error} = await supabaseServer.auth.signUp({
            email,
            password,
        })

        if (error) {
            return NextResponse.json({error: error.message}, {status: 400})
        }

        return NextResponse.json({data}, {status: 200})
    } catch {
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        )
    }
}
