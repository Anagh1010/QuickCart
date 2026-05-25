import crypto from "crypto";
import connectDB from "@/config/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ success: false, message: "Missing payment details" });
        }

        // Verify signature using HMAC-SHA256
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            // Signature mismatch — mark order as failed
            await connectDB();
            await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id, userId },
                { status: "Payment Failed", isPaid: false }
            );
            return NextResponse.json({ success: false, message: "Payment verification failed" });
        }

        // Signature is valid — mark order as paid
        await connectDB();

        const order = await Order.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id, userId },
            {
                isPaid: true,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
            },
            { new: true }
        );

        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" });
        }

        // Clear user's cart after successful payment
        const user = await User.findById(userId);
        if (user) {
            user.cartItems = {};
            await user.save();
        }

        return NextResponse.json({ success: true, message: "Payment verified successfully" });

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
