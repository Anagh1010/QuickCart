import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { logError } from "@/lib/logger";
import { getAuditRequestContext, logAudit } from '@/lib/audit'

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            await logError('/api/product/update-stock', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
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

        const previousStock = product.stock
        product.stock = Number(stock);
        await product.save();

        await logAudit('inventory.adjusted', 'product', userId, product._id.toString(), { delta: product.stock - previousStock }, {
            actorRole: 'seller', resourceLabel: product.name, request: getAuditRequestContext(request),
            changes: { before: { stock: previousStock }, after: { stock: product.stock }, fields: ['stock'] }
        })

        return NextResponse.json({ success: true, message: 'Stock updated successfully', stock: product.stock });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
