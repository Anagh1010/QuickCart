import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import connectDB from '@/config/db'
import LogSettings from '@/models/LogSettings'
import mongoose from 'mongoose'
import { invalidateLoggingCache } from '@/lib/logger'

// GET /api/admin/logs/settings
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()
        const settings = await LogSettings.findById('default').lean()
        return NextResponse.json({
            success:        true,
            ttlDays:        settings?.ttlDays        ?? 90,
            loggingEnabled: settings?.loggingEnabled ?? true,
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

// PATCH /api/admin/logs/settings
// Accepts { ttlDays? } and/or { loggingEnabled? } — both are optional per call
export async function PATCH(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const update = {}

        if (body.ttlDays !== undefined) {
            const days = body.ttlDays
            if (typeof days !== 'number' || days < 1 || days > 365) {
                return NextResponse.json({ success: false, message: 'ttlDays must be 1–365' }, { status: 400 })
            }
            update.ttlDays = days
        }

        if (body.loggingEnabled !== undefined) {
            if (typeof body.loggingEnabled !== 'boolean') {
                return NextResponse.json({ success: false, message: 'loggingEnabled must be a boolean' }, { status: 400 })
            }
            update.loggingEnabled = body.loggingEnabled
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 })
        }

        await connectDB()

        const settings = await LogSettings.findByIdAndUpdate(
            'default',
            update,
            { upsert: true, new: true }
        )

        // If TTL changed, update the live MongoDB index
        if (update.ttlDays) {
            await mongoose.connection.db.command({
                collMod: 'errorlogs',
                index: {
                    keyPattern: { createdAt: 1 },
                    expireAfterSeconds: update.ttlDays * 24 * 60 * 60
                }
            })
        }

        // Flush the in-memory cache so the toggle takes effect immediately
        invalidateLoggingCache()

        return NextResponse.json({
            success:        true,
            ttlDays:        settings.ttlDays,
            loggingEnabled: settings.loggingEnabled,
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
