import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import connectDB from '@/config/db'
import AuditLog from '@/models/AuditLog'

// GET /api/admin/audit
// ?view=summary  → aggregated counts (top actions, top users, 14-day timeline)
// ?view=feed     → paginated raw log (default)
// &action=  &resource=  &userId=  &page=  &limit=
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
        const uid      = searchParams.get('userId')
        const page     = parseInt(searchParams.get('page') || '1')
        const limit    = parseInt(searchParams.get('limit') || '50')

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

        const skip = (page - 1) * limit
        const [logs, total] = await Promise.all([
            AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AuditLog.countDocuments(query)
        ])

        return NextResponse.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

// DELETE /api/admin/audit
// Clears all audit logs
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        await connectDB()
        const result = await AuditLog.deleteMany({})

        return NextResponse.json({ success: true, message: `Cleared ${result.deletedCount} audit logs` })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
