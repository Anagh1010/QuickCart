import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

/**
 * POST /api/log/client
 * Accepts client-side performance events and slow API observations.
 * No auth required — open endpoint, but rate-limited by IP (Vercel edge).
 *
 * Body shape:
 * {
 *   metric:   string,   // e.g. 'LCP', 'FID', 'CLS', 'TTFB', 'slowApi'
 *   value:    number,   // ms or score
 *   page:     string,   // e.g. '/all-products'
 *   userId?:  string,
 *   extra?:   object
 * }
 */
export async function POST(request) {
    try {
        const body = await request.json()
        const { metric, value, page = '(unknown)', userId = '', extra = {} } = body

        if (!metric || value == null) {
            return NextResponse.json({ success: false, message: 'metric and value are required' }, { status: 400 })
        }

        // Determine level by severity thresholds
        const level = getLevel(metric, value)
        const category = 'performance'

        await logError(
            page,
            new Error(`[Client Perf] ${metric} = ${value}${getUnit(metric)}`),
            userId,
            { metric, value, ...extra },
            level,
            category,
            null
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}

// Web Vitals thresholds (Google's Good/Needs Improvement/Poor)
const THRESHOLDS = {
    LCP:    { warn: 2500, error: 4000 },   // ms
    FID:    { warn: 100,  error: 300  },   // ms
    CLS:    { warn: 0.1,  error: 0.25 },   // score
    TTFB:   { warn: 800,  error: 1800 },   // ms
    INP:    { warn: 200,  error: 500  },   // ms
    slowApi:{ warn: 2000, error: 5000 },   // ms
}

function getLevel(metric, value) {
    const t = THRESHOLDS[metric]
    if (!t) return 'info'
    if (value >= t.error) return 'error'
    if (value >= t.warn)  return 'warn'
    return 'info'
}

function getUnit(metric) {
    return metric === 'CLS' ? '' : 'ms'
}
