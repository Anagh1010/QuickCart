import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'

const VALID_ROLES = ['user', 'seller', 'admin']

export async function PATCH(request, { params }) {
    try {
        const { userId: requesterId } = getAuth(request)
        if (!requesterId || !(await authAdmin(requesterId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        const { userId } = await params
        const { role } = await request.json()

        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ success: false, message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
        }

        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { role }
        })

        return NextResponse.json({ success: true, message: `Role updated to '${role}'` })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
