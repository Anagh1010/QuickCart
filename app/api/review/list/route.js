import connectDB from "@/config/db";
import Review from "@/models/Review";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ success: false, message: "Missing productId" });
        }

        await connectDB();

        // 1. Fetch reviews
        const reviews = await Review.find({ productId }).sort({ date: -1 });

        // 2. Aggregate stats
        const stats = await Review.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            }
        ]);

        const starBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalReviews = 0;
        let ratingSum = 0;

        stats.forEach((stat) => {
            if (stat._id >= 1 && stat._id <= 5) {
                starBreakdown[stat._id] = stat.count;
                totalReviews += stat.count;
                ratingSum += stat._id * stat.count;
            }
        });

        const avgRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

        return NextResponse.json({
            success: true,
            reviews,
            stats: {
                avgRating,
                totalReviews,
                starBreakdown
            }
        });

    } catch (error) {
        console.error("Review list error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
