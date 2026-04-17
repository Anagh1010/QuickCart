import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


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
                // Fallback: return error instead of creating incomplete user
                return NextResponse.json({ success: false, message: "User not found. Please try logging in again." })
            }
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('Error fetching user data:', error)
        return NextResponse.json({ success: false, message: error.message })
    }

}