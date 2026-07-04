import { getAuth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import authAdmin from '@/lib/authAdmin'
import connectDB from '@/config/db'
import { runHealthChecks } from '@/lib/healthCheck'
import { logError } from '@/lib/logger'

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        if (!userId || !(await authAdmin(userId))) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
        }

        // Ensure DB is connected so mongo readyState is meaningful
        await connectDB()

        const results = await runHealthChecks()
        const timestamp = new Date().toISOString()

        // Log any degraded services
        for (const [service, status] of Object.entries(results)) {
            if (!status.ok) {
                const category = service === 'mongo' ? 'database' : 'infra'
                await logError(
                    `/health/${service}`,
                    new Error(status.error || `${service} unreachable`),
                    userId,
                    { latencyMs: status.latencyMs, detail: status.detail },
                    'error',
                    category,
                    503
                )
            }
        }

        const allHealthy = Object.values(results).every(s => s.ok)

        return NextResponse.json({
            success: true,
            healthy: allHealthy,
            timestamp,
            services: results
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
