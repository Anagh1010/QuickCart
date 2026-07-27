import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import connectDB from '@/config/db'
import AuditLog from '@/models/AuditLog'

// GET /api/admin/audit
// ?view=summary  → aggregated counts (top actions, top users, 14-day timeline)
// ?view=feed     → paginated raw log (default)
// &action=  &resource=  &resourceId=  &userId=  &category=  &outcome=
// &from=ISO_DATE  &to=ISO_DATE  &page=  &limit=
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const view     = searchParams.get('view') || 'feed'
        const action   = searchParams.get('action')
        const resource = searchParams.get('resource')
        const uid        = searchParams.get('userId')
        const resourceId = searchParams.get('resourceId')
        const category   = searchParams.get('category')
        const outcome    = searchParams.get('outcome')
        const from       = searchParams.get('from')
        const to         = searchParams.get('to')
        const page       = Number.parseInt(searchParams.get('page') || '1', 10)
        const limit      = Number.parseInt(searchParams.get('limit') || '50', 10)

        if (!['feed', 'summary'].includes(view)) {
            return NextResponse.json({ success: false, message: 'Invalid view' }, { status: 400 })
        }
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return NextResponse.json({ success: false, message: 'page must be positive and limit must be 1–100' }, { status: 400 })
        }

        const createdAt = {}
        if (from) {
            const date = new Date(from)
            if (Number.isNaN(date.getTime())) return NextResponse.json({ success: false, message: 'Invalid from date' }, { status: 400 })
            createdAt.$gte = date
        }
        if (to) {
            const date = new Date(to)
            if (Number.isNaN(date.getTime())) return NextResponse.json({ success: false, message: 'Invalid to date' }, { status: 400 })
            createdAt.$lte = date
        }

        // ── Summary view ─────────────────────────────────────────────────────
        if (view === 'summary') {
            const now   = new Date()
            const day1  = new Date(now - 86400_000)
            const day7  = new Date(now - 7  * 86400_000)
            const day30 = new Date(now - 30 * 86400_000)

            const [
                totalToday, total7d, total30d,
                topActions, topUsers, timeline
            ] = await Promise.all([
                AuditLog.countDocuments({ createdAt: { $gte: day1 } }),
                AuditLog.countDocuments({ createdAt: { $gte: day7 } }),
                AuditLog.countDocuments({ createdAt: { $gte: day30 } }),

                // Top 10 actions by count (all time)
                AuditLog.aggregate([
                    { $group: { _id: '$action', count: { $sum: 1 }, resource: { $first: '$resource' } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]),

                // Top 10 most active users (last 30 days, skip anonymous)
                AuditLog.aggregate([
                    { $match: { userId: { $ne: '' }, createdAt: { $gte: day30 } } },
                    { $group: { _id: '$userId', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]),

                // Daily event counts for the last 14 days
                AuditLog.aggregate([
                    { $match: { createdAt: { $gte: new Date(now - 14 * 86400_000) } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])
            ])

            return NextResponse.json({
                success: true,
                summary: { totalToday, total7d, total30d },
                topActions,
                topUsers,
                timeline
            })
        }

        // ── Feed view (paginated raw log) ────────────────────────────────────
        const query = {}
        if (action)   query.action   = action
        if (resource) query.resource = resource
        if (uid)      query.userId   = uid
        if (resourceId) query.resourceId = resourceId
        if (category) query.category = category
        if (outcome) query.outcome = outcome
        if (Object.keys(createdAt).length) query.createdAt = createdAt

        const skip = (page - 1) * limit
        const [logs, total] = await Promise.all([
            AuditLog.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
            AuditLog.countDocuments(query)
        ])

        return NextResponse.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
