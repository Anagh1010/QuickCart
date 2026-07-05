import connectDB from "@/config/db";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logAudit, hasRecentAudit } from '@/lib/audit'


export async function GET(request) {
    try {
        const { userId } = getAuth(request)

        await connectDB()
        const user = await User.findById(userId)

        if (!user) {
            return NextResponse.json({ success: true, cartItems: {} })
        }

        const { cartItems } = user

        // Deduplicate within 5 minutes — cart is fetched on every cart/checkout page mount
        const alreadyLogged = await hasRecentAudit('cart.viewed', userId, 5)
        if (!alreadyLogged) {
            await logAudit('cart.viewed', 'cart', userId)
        }
        return NextResponse.json({ success: true, cartItems})

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}