import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { logError } from "@/lib/logger";
import { getAuditRequestContext, logAudit } from '@/lib/audit'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            await logError('/api/product/edit', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
        }

        const formData = await request.formData();

        const productId = formData.get('productId');
        const name = formData.get('name');
        const description = formData.get('description');
        const category = formData.get('category');
        const price = formData.get('price');
        const offerPrice = formData.get('offerPrice');
        const stock = formData.get('stock');

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Missing product ID' });
        }

        await connectDB();

        // Verify product belongs to this seller before editing
        const product = await Product.findOne({ _id: productId, userId });
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found or unauthorized' });
        }

        // Get array of existing image URLs that the seller wants to keep
        const existingImages = formData.getAll('existingImages');

        // Parse any new image files
        const files = formData.getAll('images');
        let newImageUrls = [];

        if (files && files.length > 0) {
            const uploadResults = await Promise.all(
                files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    return new Promise((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { resource_type: 'auto' },
                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );
                        stream.end(buffer);
                    });
                })
            );
            newImageUrls = uploadResults.map(res => res.secure_url);
        }

        // Combine existing and new image URLs
        const finalImages = [...existingImages, ...newImageUrls];

        if (finalImages.length === 0) {
            return NextResponse.json({ success: false, message: 'At least one product image is required' });
        }

        const before = { name: product.name, category: product.category, price: product.price, offerPrice: product.offerPrice, stock: product.stock, imageCount: product.image?.length || 0 }

        // Update product details
        product.name = name || product.name;
        product.description = description || product.description;
        product.category = category || product.category;
        product.price = price !== null ? Number(price) : product.price;
        product.offerPrice = offerPrice !== null ? Number(offerPrice) : product.offerPrice;
        product.stock = stock !== null ? Number(stock) : product.stock;
        product.image = finalImages;

        await product.save();

        const after = { name: product.name, category: product.category, price: product.price, offerPrice: product.offerPrice, stock: product.stock, imageCount: product.image?.length || 0 }
        const fields = Object.keys(after).filter(key => before[key] !== after[key])
        await logAudit('product.updated', 'product', userId, product._id.toString(), {}, {
            actorRole: 'seller', resourceLabel: product.name, request: getAuditRequestContext(request),
            changes: { before, after, fields }
        })

        return NextResponse.json({ success: true, message: 'Product updated successfully', product });

    } catch (error) {
        console.error("Product edit error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
