import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { logError } from "@/lib/logger";
import { getAuditRequestContext, logAudit } from '@/lib/audit'

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            await logError('/api/product/delete', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Missing product id' });
        }

        await connectDB();

        // Verify product belongs to this seller before deleting
        const product = await Product.findOne({ _id: productId, userId });
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found or unauthorized' });
        }

        const snapshot = { name: product.name, category: product.category, price: product.price, offerPrice: product.offerPrice, stock: product.stock }

        // Delete product
        await Product.findByIdAndDelete(productId);

        // Cleanup reviews associated with this product
        await Review.deleteMany({ productId });

        await logAudit('product.deleted', 'product', userId, productId, {}, {
            actorRole: 'seller', resourceLabel: product.name, request: getAuditRequestContext(request),
            changes: { before: snapshot, fields: Object.keys(snapshot) }
        })

        return NextResponse.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
