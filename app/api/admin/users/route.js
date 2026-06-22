import connectDB from '@/config/db'
import User from '@/models/User'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()

        // Get all users from MongoDB
        const dbUsers = await User.find({}).lean()

        // Fetch Clerk metadata for role info
        const client = await clerkClient()
        const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })

        const clerkDataMap = {}
        for (const cu of clerkUsers) {
            clerkDataMap[cu.id] = {
                role: cu.publicMetadata?.role || 'user',
                imageUrl: cu.imageUrl,
                name: [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.emailAddresses?.[0]?.emailAddress || 'User'
            }
        }

        const users = dbUsers.map(u => ({
            ...u,
            role: clerkDataMap[u._id]?.role || 'user',
            imageUrl: clerkDataMap[u._id]?.imageUrl || u.imageUrl,
            name: clerkDataMap[u._id]?.name || u.name
        }))

        return NextResponse.json({ success: true, users })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
