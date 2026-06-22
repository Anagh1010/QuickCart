import connectDB from '@/config/db'
import Product from '@/models/Product'
import Review from '@/models/Review'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

export async function GET(request) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')
        const minPrice = searchParams.get('minPrice')
        const maxPrice = searchParams.get('maxPrice')
        const inStock = searchParams.get('inStock')
        const sort = searchParams.get('sort')

        // Build dynamic query match criteria
        const matchCriteria = {}

        if (search) {
            const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            matchCriteria.name = { $regex: escapedSearch, $options: 'i' }
        }

        if (category) {
            matchCriteria.category = { $in: category.split(',') }
        }

        if (minPrice || maxPrice) {
            matchCriteria.offerPrice = {}
            if (minPrice) matchCriteria.offerPrice.$gte = Number(minPrice)
            if (maxPrice) matchCriteria.offerPrice.$lte = Number(maxPrice)
        }

        if (inStock === 'true') {
            matchCriteria.stock = { $gt: 0 }
        }

        // Build sort criteria
        let sortFields = { date: -1 }
        if (sort === 'price-asc') {
            sortFields = { offerPrice: 1 }
        } else if (sort === 'price-desc') {
            sortFields = { offerPrice: -1 }
        } else if (sort === 'newest') {
            sortFields = { date: -1 }
        } else if (sort === 'rating') {
            sortFields = { avgRating: -1, date: -1 }
        }

        // Run aggregation pipeline to dynamically compute reviews analytics
        const products = await Product.aggregate([
            { $match: matchCriteria },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'reviewsList'
                }
            },
            {
                $addFields: {
                    avgRating: { $ifNull: [{ $avg: '$reviewsList.rating' }, 0] },
                    totalReviews: { $size: '$reviewsList' }
                }
            },
            { $sort: sortFields }
        ])

        return NextResponse.json({ success: true, products })

    } catch (error) {
        await logError('/api/product/list', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}