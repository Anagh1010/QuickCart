import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import { getAuditRequestContext, logAudit } from '@/lib/audit'

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
        const targetUser = await client.users.getUser(userId)
        const previousRole = targetUser.publicMetadata?.role || 'user'
        await client.users.updateUserMetadata(userId, {
            publicMetadata: { role }
        })

        await logAudit('user.role_changed', 'user', requesterId, userId, { targetUserId: userId }, {
            actorRole: 'admin', resourceLabel: userId, request: getAuditRequestContext(request),
            changes: { before: { role: previousRole }, after: { role }, fields: ['role'] }
        })

        return NextResponse.json({ success: true, message: `Role updated to '${role}'` })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
