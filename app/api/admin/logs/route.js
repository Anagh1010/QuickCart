import connectDB from '@/config/db'
import ErrorLog from '@/models/ErrorLog'
import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const level = searchParams.get('level')
        const route = searchParams.get('route')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const query = {}
        if (level && level !== 'all') query.level = level
        if (route) query.route = { $regex: route, $options: 'i' }

        const [logs, total] = await Promise.all([
            ErrorLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            ErrorLog.countDocuments(query)
        ])

        return NextResponse.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '30')
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

        const result = await ErrorLog.deleteMany({ createdAt: { $lt: cutoff } })
        return NextResponse.json({ success: true, deleted: result.deletedCount })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
