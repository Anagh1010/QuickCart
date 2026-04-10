import { inngest } from "@/config/inngest";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



export async function POST(request) {
    try {

        const { userId } = getAuth(request)
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid data' });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' });
        }

        await connectDB()

        // calculate amount using items
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                amount += product.offerPrice * item.quantity;
            }
        }

        const totalAmount = amount + Math.floor(amount * 0.02);
        console.log('Order being created:', { userId, address, itemsCount: items.length, totalAmount });

        // Convert IDs to ObjectId
        const orderData = {
            userId,
            items: items.map(item => ({
                product: new mongoose.Types.ObjectId(item.product),
                quantity: item.quantity
            })),
            amount: totalAmount,
            address: new mongoose.Types.ObjectId(address),
            status: 'Order Placed',
            date: Date.now()
        };

        // Save order directly to database
        const savedOrder = await Order.create(orderData);
        console.log('Order saved to database:', savedOrder._id);

        // Also send event to Inngest for any additional processing
        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount: totalAmount,
                date: Date.now(),
                status: 'Order Placed'
            }
        })

        // clear user cart
        const user = await User.findById(userId)
        if (user) {
            user.cartItems = {}
            await user.save()
        }

        return NextResponse.json({ success: true, message: 'Order Placed', orderId: savedOrder._id })

    } catch (error) {
        console.error('Order creation error:', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}