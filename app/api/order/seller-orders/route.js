import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(request) {
    try {
        
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' })
        }

        await connectDB()

        // Get only this seller's product IDs
        const sellerProducts = await Product.find({ userId }).select('_id').lean()
        const sellerProductIds = sellerProducts.map(p => p._id.toString())

        if (sellerProductIds.length === 0) {
            return NextResponse.json({ success: true, orders: [] })
        }

        // Find orders that contain at least one of this seller's products
        const orders = await Order.find({
            'items.product': { $in: sellerProductIds }
        }).populate('address items.product').lean()

        // Filter each order's items to only show this seller's products
        const filteredOrders = orders.map(order => ({
            ...order,
            items: order.items.filter(item =>
                item.product && sellerProductIds.includes(item.product._id.toString())
            )
        }))

        return NextResponse.json({ success: true, orders: filteredOrders })

    } catch (error) {
        await logError('/api/order/seller-orders', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}