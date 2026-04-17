import connectDB from '@/config/db'
import User from '@/models/User'
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'


export async function POST(request) {
    try {
        
        const  { userId } = getAuth(request)
        
        const { cartData } = await request.json()

        await connectDB()
        let user = await User.findById(userId)

        if (!user) {
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
                return NextResponse.json({ success: false, message: "User not found. Please try logging in again." })
            }
        }

        user.cartItems = cartData
        await user.save()

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json( { success:false, message:error.message } )
    }
}