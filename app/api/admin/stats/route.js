import connectDB from '@/config/db'
import User from '@/models/User'
import Order from '@/models/Order'
import Product from '@/models/Product'
import ErrorLog from '@/models/ErrorLog'
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

        const client = await clerkClient()
        const { data: clerkUsers } = await client.users.getUserList({ limit: 500 })
        const sellerCount = clerkUsers.filter(u => ['seller', 'admin'].includes(u.publicMetadata?.role)).length

        const [totalUsers, totalOrders, totalProducts, recentErrors, totalRevenue] = await Promise.all([
            User.countDocuments(),
            Order.countDocuments(),
            Product.countDocuments(),
            ErrorLog.find({ level: 'error' }).sort({ createdAt: -1 }).limit(5).lean(),
            Order.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
        ])

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalSellers: sellerCount,
                totalOrders,
                totalProducts,
                totalRevenue: totalRevenue[0]?.total || 0,
                recentErrors
            }
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
