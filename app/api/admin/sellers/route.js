import connectDB from '@/config/db'
import User from '@/models/User'
import Product from '@/models/Product'
import Order from '@/models/Order'
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
        const sellerIds = clerkUsers
            .filter(u => ['seller', 'admin'].includes(u.publicMetadata?.role))
            .map(u => u.id)

        const dbUsers = await User.find({ _id: { $in: sellerIds } }).lean()

        // Get product/order counts per seller
        const [productCounts, orderCounts] = await Promise.all([
            Product.aggregate([
                { $match: { userId: { $in: sellerIds } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { userId: { $in: sellerIds } } },
                { $group: { _id: '$userId', count: { $sum: 1 } } }
            ])
        ])

        const productMap = Object.fromEntries(productCounts.map(p => [p._id, p.count]))
        const orderMap = Object.fromEntries(orderCounts.map(o => [o._id, o.count]))

        const clerkRoleMap = Object.fromEntries(
            clerkUsers.filter(u => sellerIds.includes(u.id)).map(u => [u.id, {
                role: u.publicMetadata?.role,
                imageUrl: u.imageUrl
            }])
        )

        const sellers = dbUsers.map(u => ({
            ...u,
            role: clerkRoleMap[u._id]?.role || 'seller',
            imageUrl: clerkRoleMap[u._id]?.imageUrl || u.imageUrl,
            productCount: productMap[u._id] || 0,
            orderCount: orderMap[u._id] || 0
        }))

        return NextResponse.json({ success: true, sellers })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
