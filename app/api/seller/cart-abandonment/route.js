import connectDB from '@/config/db'
import authSeller from '@/lib/authSeller'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const from = searchParams.get('from') // ISO date string
        const to = searchParams.get('to')

        const fromTs = from ? new Date(from).getTime() : Date.now() - 30 * 24 * 60 * 60 * 1000
        const toTs = to ? new Date(to).setHours(23, 59, 59, 999) : Date.now()

        await connectDB()

        // 1. Get this seller's products
        const sellerProducts = await Product.find({ userId }).select('_id name image offerPrice').lean()
        if (sellerProducts.length === 0) {
            return NextResponse.json({ success: true, results: [] })
        }

        const sellerProductIds = sellerProducts.map(p => p._id.toString())

        // 2. Find all users who currently have any of these products in their cart
        //    cartItems is stored as { [productId]: quantity }
        const allUsers = await User.find({}).select('_id cartItems').lean()

        // Build a map: productId -> set of userIds who have it in cart
        const cartUsersMap = {}
        sellerProductIds.forEach(id => { cartUsersMap[id] = new Set() })

        for (const user of allUsers) {
            const cart = user.cartItems || {}
            for (const productId of sellerProductIds) {
                if (cart[productId] && Number(cart[productId]) > 0) {
                    cartUsersMap[productId].add(user._id.toString())
                }
            }
        }

        // 3. Find all orders in the date range containing this seller's products
        const ordersInRange = await Order.find({
            date: { $gte: fromTs, $lte: toTs },
            'items.product': { $in: sellerProductIds }
        }).select('userId items').lean()

        // Build a map: productId -> set of userIds who ordered it in the period
        const orderedUsersMap = {}
        sellerProductIds.forEach(id => { orderedUsersMap[id] = new Set() })

        for (const order of ordersInRange) {
            for (const item of order.items) {
                const pid = item.product.toString()
                if (orderedUsersMap[pid]) {
                    orderedUsersMap[pid].add(order.userId.toString())
                }
            }
        }

        // 4. Build per-product abandonment results
        const results = sellerProducts.map(product => {
            const pid = product._id.toString()
            const inCartUsers = cartUsersMap[pid]
            const orderedUsers = orderedUsersMap[pid]

            const inCartCount = inCartUsers.size
            const orderedCount = orderedUsers.size

            // Abandoned = in cart but didn't order in the period
            const abandonedCount = [...inCartUsers].filter(uid => !orderedUsers.has(uid)).length
            const abandonmentRate = inCartCount > 0 ? Math.round((abandonedCount / inCartCount) * 100) : 0

            return {
                productId: pid,
                name: product.name,
                image: product.image?.[0] || '',
                price: product.offerPrice,
                inCartCount,
                orderedCount,
                abandonedCount,
                abandonmentRate
            }
        })

        // Sort by abandoned count descending
        results.sort((a, b) => b.abandonedCount - a.abandonedCount)

        return NextResponse.json({ success: true, results, from: fromTs, to: toTs })

    } catch (error) {
        await logError('/api/seller/cart-abandonment', error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
