import { getAuth } from '@clerk/nextjs/server'
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Coupon from "@/models/Coupon";
import { logError } from "@/lib/logger";
import { getAuditRequestContext, logAudit } from '@/lib/audit'

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);
        if (!isSeller) {
            await logError('/api/coupon/manage', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
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
            await logError('/api/coupon/manage', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
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

        await logAudit('coupon.created', 'coupon', userId, newCoupon._id.toString(), { discountType: newCoupon.discountType }, {
            actorRole: 'seller', resourceLabel: newCoupon.code, request: getAuditRequestContext(request),
            changes: { after: { code: newCoupon.code, discountValue: newCoupon.discountValue, minCartAmount: newCoupon.minCartAmount, expiryDate: newCoupon.expiryDate, isActive: newCoupon.isActive }, fields: ['code', 'discountValue', 'minCartAmount', 'expiryDate', 'isActive'] }
        })

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
            await logError('/api/coupon/manage', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const couponId = searchParams.get('id');

        if (!couponId) {
            return NextResponse.json({ success: false, message: 'Missing id parameter' });
        }

        await connectDB();
        const coupon = await Coupon.findByIdAndDelete(couponId);
        if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 })

        await logAudit('coupon.deleted', 'coupon', userId, couponId, {}, {
            actorRole: 'seller', resourceLabel: coupon.code, request: getAuditRequestContext(request),
            changes: { before: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, minCartAmount: coupon.minCartAmount, expiryDate: coupon.expiryDate, isActive: coupon.isActive }, fields: ['code', 'discountType', 'discountValue', 'minCartAmount', 'expiryDate', 'isActive'] }
        })

        return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}
