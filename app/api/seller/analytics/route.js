import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        await connectDB();

        // 1. Fetch all product IDs owned by this seller
        const sellerProducts = await Product.find({ userId }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        if (productIds.length === 0) {
            return NextResponse.json({
                success: true,
                totalRevenue: 0,
                totalOrdersCount: 0,
                totalProductsCount: 0,
                categoryData: [],
                timelineData: []
            });
        }

        // 2. Aggregate Total Revenue & Unique Orders Count for this seller's products
        const revenueStats = await Order.aggregate([
            { $match: { "items.product": { $in: productIds }, $or: [{ isPaid: true }, { paymentMethod: 'COD' }] } },
            { $unwind: "$items" },
            { $match: { "items.product": { $in: productIds } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ["$productInfo.offerPrice", "$items.quantity"] } },
                    totalOrders: { $addToSet: "$_id" }
                }
            }
        ]);

        const stats = revenueStats[0] || { totalRevenue: 0, totalOrders: [] };
        const totalRevenue = stats.totalRevenue;
        const totalOrdersCount = stats.totalOrders.length;
        const totalProductsCount = productIds.length;

        // 3. Aggregate Category Distribution for this seller's products
        const categoryStats = await Order.aggregate([
            { $match: { "items.product": { $in: productIds }, $or: [{ isPaid: true }, { paymentMethod: 'COD' }] } },
            { $unwind: "$items" },
            { $match: { "items.product": { $in: productIds } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: "$productInfo.category",
                    value: { $sum: { $multiply: ["$productInfo.offerPrice", "$items.quantity"] } }
                }
            },
            {
                $project: {
                    name: "$_id",
                    value: 1,
                    _id: 0
                }
            }
        ]);

        // 4. Aggregate Sales growth daily timeline for this seller's products
        const salesTimeline = await Order.aggregate([
            { $match: { "items.product": { $in: productIds }, $or: [{ isPaid: true }, { paymentMethod: 'COD' }] } },
            { $unwind: "$items" },
            { $match: { "items.product": { $in: productIds } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: { $toDate: "$date" }
                        }
                    },
                    revenue: { $sum: { $multiply: ["$productInfo.offerPrice", "$items.quantity"] } }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    revenue: 1,
                    _id: 0
                }
            }
        ]);

        return NextResponse.json({
            success: true,
            totalRevenue,
            totalOrdersCount,
            totalProductsCount,
            categoryData: categoryStats,
            timelineData: salesTimeline
        });

    } catch (error) {
        console.error("Seller analytics error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
