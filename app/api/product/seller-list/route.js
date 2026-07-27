import connectDB from '@/config/db'
import authSeller from '@/lib/authSeller'
import Product from '@/models/Product'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

export async function GET(request) {
    try {
        
        const { userId } = getAuth(request)

        const isSeller = await authSeller(userId)

        if (!isSeller) {
            await logError('/api/product/seller-list', new Error('Unauthorized access attempt'), userId || '', {}, 'warn', 'auth', 403)
            return NextResponse.json({ success: false, message: 'not authorized' }, { status: 403 });
        }

        await connectDB()

        const products = await Product.find({ userId })
        return NextResponse.json({ success:true, products })

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message })
    }
}