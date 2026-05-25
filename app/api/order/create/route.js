import Razorpay from "razorpay";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { address, items, paymentMethod } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid data" });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        await connectDB();

        // Calculate amount server-side using product prices
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                amount += product.offerPrice * item.quantity;
            }
        }

        const totalAmount = amount + Math.floor(amount * 0.02);

        // Build order data
        const orderData = {
            userId,
            items: items.map((item) => ({
                product: new mongoose.Types.ObjectId(item.product),
                quantity: item.quantity,
            })),
            amount: totalAmount,
            address: new mongoose.Types.ObjectId(address),
            status: "Order Placed",
            date: Date.now(),
            paymentMethod: paymentMethod === "Online" ? "Online" : "COD",
            isPaid: false,
        };

        // ----- COD Flow -----
        if (paymentMethod !== "Online") {
            const savedOrder = await Order.create(orderData);

            // Clear user's cart
            const user = await User.findById(userId);
            if (user) {
                user.cartItems = {};
                await user.save();
            }

            return NextResponse.json({
                success: true,
                message: "Order Placed",
                orderId: savedOrder._id,
            });
        }

        // ----- Online Payment Flow -----
        // Create a Razorpay order
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalAmount * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: `order_${Date.now()}`,
        });

        // Save order to DB with Razorpay order ID (unpaid for now)
        orderData.razorpayOrderId = razorpayOrder.id;
        const savedOrder = await Order.create(orderData);

        return NextResponse.json({
            success: true,
            message: "Razorpay order created",
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            },
            orderId: savedOrder._id,
        });

    } catch (error) {
        console.error("Order creation error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}