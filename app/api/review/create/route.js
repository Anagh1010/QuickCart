import connectDB from "@/config/db";
import Review from "@/models/Review";
import Order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" });
        }

        const { productId, rating, comment, userName, userImage } = await request.json();

        if (!productId || !rating || !comment || !userName) {
            return NextResponse.json({ success: false, message: "Missing required review fields" });
        }

        await connectDB();

        // Check if the user has a verified purchase of this product
        const orderExists = await Order.findOne({
            userId,
            "items.product": productId,
            isPaid: true
        }) || await Order.findOne({
            userId,
            "items.product": productId,
            paymentMethod: "COD"
        });

        const isVerified = !!orderExists;

        const newReview = await Review.create({
            productId,
            userId,
            userName,
            userImage: userImage || "",
            rating: Number(rating),
            comment,
            isVerified,
            date: Date.now()
        });

        return NextResponse.json({ success: true, message: "Review submitted successfully", review: newReview });

    } catch (error) {
        console.error("Review creation error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
