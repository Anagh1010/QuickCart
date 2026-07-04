import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import connectDB from '@/config/db'
import ErrorLog from '@/models/ErrorLog'

/**
 * Infer category from route + message for legacy logs that have category = 'api' or null
 * and were created before the category/statusCode fields existed.
 */
function inferCategory(route = '', message = '') {
    const r = route.toLowerCase()
    const m = message.toLowerCase()

    if (r.includes('/health') || m.includes('unreachable') || m.includes('timeout') || m.includes('cron')) return 'infra'
    if (r.includes('/config/db') || m.includes('mongo') || m.includes('econnrefused') || m.includes('connection') || m.includes('database')) return 'database'
    if (r.includes('/user') || r.includes('/clerk') || m.includes('unauthorized') || m.includes('not authorized') || m.includes('clerk')) return 'auth'
    if (r.includes('/product/add') || m.includes('cloudinary') || m.includes('upload') || m.includes('storage')) return 'storage'
    if (m.includes('[client perf]') || m.includes('lcp') || m.includes('fid') || m.includes('cls') || m.includes('slowapi')) return 'performance'
    return 'api'
}

/**
 * Infer HTTP status code from message + existing level for legacy logs.
 */
function inferStatusCode(message = '', level = 'error', category = 'api') {
    const m = message.toLowerCase()

    if (m.includes('unauthorized') || m.includes('not authorized')) return 403
    if (m.includes('not found'))                                      return 404
    if (m.includes('bad request') || m.includes('missing field'))     return 400
    if (m.includes('unreachable') || m.includes('timeout') || category === 'infra') return 503
    if (m.includes('clerk') || m.includes('502'))                     return 502
    if (level === 'error')                                            return 500
    if (level === 'warn')                                             return 403
    return null
}

// POST /api/admin/logs/migrate — backfill category + statusCode on legacy logs
export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()

        // Find logs that have never had category/statusCode properly set:
        // category is still the bare default 'api' or missing, AND statusCode is null
        const legacyLogs = await ErrorLog.find({
            $or: [
                { category: { $exists: false } },
                { statusCode: { $exists: false } },
                { statusCode: null }
            ]
        }).select('_id route message level category statusCode').lean()

        if (legacyLogs.length === 0) {
            return NextResponse.json({ success: true, updated: 0, message: 'All logs already have tags' })
        }

        // Build bulk operations
        const bulkOps = legacyLogs.map(log => {
            const category   = log.category && log.category !== 'api'
                ? log.category
                : inferCategory(log.route, log.message)

            const statusCode = log.statusCode != null
                ? log.statusCode
                : inferStatusCode(log.message, log.level, category)

            return {
                updateOne: {
                    filter: { _id: log._id },
                    update: { $set: { category, statusCode } }
                }
            }
        })

        const result = await ErrorLog.bulkWrite(bulkOps)

        return NextResponse.json({
            success: true,
            updated:  result.modifiedCount,
            total:    legacyLogs.length,
            message: `Tagged ${result.modifiedCount} of ${legacyLogs.length} legacy logs`
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
