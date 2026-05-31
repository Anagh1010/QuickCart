import connectDB from "@/config/db";
import Coupon from "@/models/Coupon";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { code, cartAmount } = await request.json();

        if (!code || cartAmount === undefined || isNaN(Number(cartAmount))) {
            return NextResponse.json({ success: false, message: "Invalid parameters" });
        }

        await connectDB();

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return NextResponse.json({ success: false, message: "Invalid or inactive promo code" });
        }

        if (new Date(coupon.expiryDate) < new Date()) {
            return NextResponse.json({ success: false, message: "Promo code has expired" });
        }

        if (Number(cartAmount) < coupon.minCartAmount) {
            return NextResponse.json({ 
                success: false, 
                message: `Minimum order value of $${coupon.minCartAmount} is required to apply this coupon.` 
            });
        }

        return NextResponse.json({
            success: true,
            message: "Coupon applied successfully",
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        });

    } catch (error) {
        console.error("Coupon validation error:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}
