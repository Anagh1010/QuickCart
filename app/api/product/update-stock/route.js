import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        const { productId, stock } = await request.json();

        if (!productId || stock === undefined || isNaN(Number(stock))) {
            return NextResponse.json({ success: false, message: 'invalid input parameters' });
        }

        await connectDB();

        // Verify product belongs to this seller
        const product = await Product.findOne({ _id: productId, userId });
        if (!product) {
            return NextResponse.json({ success: false, message: 'product not found or unauthorized' });
        }

        product.stock = Number(stock);
        await product.save();

        return NextResponse.json({ success: true, message: 'Stock updated successfully', stock: product.stock });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
