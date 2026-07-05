import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { logAudit, hasRecentAudit } from '@/lib/audit'


export async function GET(request) {
    
    try {
        
        const { userId } = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" })
        }

        await connectDB()
        let user = await User.findById(userId)

        if (!user) {
            // Auto-create user if not found (for Clerk syncing delays)
            try {
                const client = await clerkClient()
                const clerkUser = await client.users.getUser(userId)
                user = await User.create({
                    _id: userId,
                    name: clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : clerkUser.firstName || "User",
                    email: clerkUser.emailAddresses[0]?.emailAddress || "no-email@example.com",
                    imageUrl: clerkUser.imageUrl || "",
                    cartItems: {}
                })
            } catch (clerkError) {
                console.error('Error fetching from Clerk:', clerkError)
                await logError('/api/user/data', clerkError, userId, { context: 'clerk-fetch' }, 'error', 'auth', 502)
                return NextResponse.json({ success: false, message: "User not found. Please try logging in again." })
            }
        }

        // Only log a session event once per 30 minutes per user
        // AppContext retries on failure which would otherwise create duplicates
        const alreadyLogged = await hasRecentAudit('user.session_started', userId, 30)
        if (!alreadyLogged) {
            await logAudit('user.session_started', 'user', userId)
        }
        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('Error fetching user data:', error)
        await logError('/api/user/data', error, '', {}, 'error', 'api', 500)
        return NextResponse.json({ success: false, message: error.message })
    }

}