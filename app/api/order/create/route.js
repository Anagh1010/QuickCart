import Razorpay from "razorpay";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { inngest } from "@/config/inngest";
import mongoose from "mongoose";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function POST(request) {
    let reservedItems = [];
    try {
        const { userId } = getAuth(request);
        const { address, items, paymentMethod, couponCode } = await request.json();

        if (!address || !items || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid data" });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        await connectDB();

        // 1. Atomic Inventory Reservation
        for (const item of items) {
            const result = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
            if (!result) {
                // Rollback already reserved stock for this order
                for (const rollback of reservedItems) {
                    await Product.findByIdAndUpdate(rollback.product, { $inc: { stock: rollback.quantity } });
                }
                return NextResponse.json({ 
                    success: false, 
                    message: "One or more products became out of stock or have insufficient inventory. Please verify your cart." 
                });
            }
            reservedItems.push(item);
        }

        // 2. Calculate Subtotal Server-side
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                amount += product.offerPrice * item.quantity;
            }
        }

        // 3. Apply Promo/Coupon Discount
        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (coupon && coupon.expiryDate >= new Date() && amount >= coupon.minCartAmount) {
                if (coupon.discountType === "percentage") {
                    discount = Math.floor(amount * (coupon.discountValue / 100));
                } else if (coupon.discountType === "flat") {
                    discount = coupon.discountValue;
                }
                discount = Math.min(discount, amount); // Cap discount at subtotal
                amount = Math.max(0, amount - discount);
            }
        }

        // 4. Calculate Total with 2% tax
        const totalAmount = amount + Math.floor(amount * 0.02);

        // Build order object
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
            couponCode: couponCode ? couponCode.toUpperCase() : "",
            discount: discount
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

        // ----- Online Payment Flow (Razorpay) -----
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalAmount * 100, // paise
            currency: "INR",
            receipt: `order_${Date.now()}`,
        });

        // Save order to DB with Razorpay order ID (unpaid)
        orderData.razorpayOrderId = razorpayOrder.id;
        const savedOrder = await Order.create(orderData);

        // Send event to Inngest to trigger the 10-minute cart abandonment safety check
        await inngest.send({
            name: "order/created",
            data: { orderId: savedOrder._id.toString() },
        });

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
        await logError('/api/order/create', error, '', { reservedItems })
        // Rollback reserved stock on failure to preserve inventory levels
        if (reservedItems.length > 0) {
            for (const rollback of reservedItems) {
                await Product.findByIdAndUpdate(rollback.product, { $inc: { stock: rollback.quantity } });
            }
        }
        return NextResponse.json({ success: false, message: error.message });
    }
}