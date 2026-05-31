import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Coupon from "@/models/Coupon";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        await connectDB();
        const coupons = await Coupon.find({}).sort({ expiryDate: 1 });
        return NextResponse.json({ success: true, coupons });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        const { code, discountType, discountValue, minCartAmount, expiryDate } = await request.json();

        if (!code || !discountType || !discountValue || !expiryDate) {
            return NextResponse.json({ success: false, message: 'Missing fields' });
        }

        await connectDB();
        const newCoupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            minCartAmount: Number(minCartAmount) || 0,
            expiryDate: new Date(expiryDate),
            isActive: true
        });

        return NextResponse.json({ success: true, message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            return NextResponse.json({ success: false, message: 'not authorized' });
        }

        const { searchParams } = new URL(request.url);
        const couponId = searchParams.get('id');

        if (!couponId) {
            return NextResponse.json({ success: false, message: 'Missing id parameter' });
        }

        await connectDB();
        await Coupon.findByIdAndDelete(couponId);

        return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
