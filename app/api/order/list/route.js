import connectDB from "@/config/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Address from "@/models/Address";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



export async function GET(request) {
    try {
        
        const {userId} = getAuth(request)

        if (!userId) {
            return NextResponse.json({ success:false, message: 'User not authenticated' })
        }

        await connectDB()

        console.log('Fetching orders for userId:', userId);
        
        // First check if orders exist at all
        const totalOrders = await Order.countDocuments({userId});
        console.log(`Found ${totalOrders} orders for user ${userId}`);

        const orders = await Order.find({userId})
            .populate({
                path: 'items.product',
                model: 'product',
                select: 'name offerPrice image'
            })
            .populate({
                path: 'address',
                model: 'address',
                select: 'fullName phoneNumber area city state'
            })
            .sort({ date: -1 })
            .lean()

        console.log('Populated orders:', orders.length);

        return NextResponse.json({ success:true, orders: orders || [] })

    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ success:false, message: error.message })
    }
}