import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import authAdmin from '@/lib/authAdmin'
import { getAuth } from '@clerk/nextjs/server'

const VALID_LEVELS     = ['error', 'warn', 'info']
const VALID_CATEGORIES = ['api', 'database', 'auth', 'storage', 'performance', 'infra', 'client']

// Preset test cases per category — realistic messages + appropriate status codes
const CATEGORY_PRESETS = {
    api:         { message: 'Test API ERROR — simulated route exception',            statusCode: 500 },
    database:    { message: 'Test DB ERROR — MongoServerError: connection refused',  statusCode: 503 },
    auth:        { message: 'Test AUTH WARN — unauthorized access attempt',          statusCode: 403 },
    storage:     { message: 'Test STORAGE ERROR — Cloudinary upload failed',         statusCode: 502 },
    performance: { message: '[Client Perf] LCP = 4800ms — above poor threshold',    statusCode: null },
    infra:       { message: 'Test INFRA ERROR — clerk unreachable (health probe)',   statusCode: 503 },
    client:      { message: 'Test CLIENT ERROR — uncaught TypeError in browser',     statusCode: null },
}

// GET /api/admin/logs/test?level=error|warn|info&category=api|database|...&statusCode=500
export async function GET(request) {
    const { userId } = getAuth(request)
    if (!userId || !(await authAdmin(userId))) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    const level      = VALID_LEVELS.includes(searchParams.get('level'))         ? searchParams.get('level')    : 'info'
    const category   = VALID_CATEGORIES.includes(searchParams.get('category'))  ? searchParams.get('category') : 'api'
    const rawCode    = searchParams.get('statusCode')
    const statusCode = rawCode ? parseInt(rawCode) : (CATEGORY_PRESETS[category]?.statusCode ?? null)

    const preset  = CATEGORY_PRESETS[category]
    const message = preset?.message || `Test ${level.toUpperCase()} — simulated ${category} event`

    const fakeError = new Error(message)
    // Only include a stack trace for error-level logs — mirrors real behavior
    if (level === 'error') {
        fakeError.stack = `Error: ${message}\n    at TestEndpoint (/api/admin/logs/test/route.js:1:1)\n    at AdminPanel (manual test trigger)`
    } else {
        fakeError.stack = undefined
    }

    await logError(
        '/api/admin/logs/test',
        fakeError,
        userId,
        { triggeredBy: 'admin-test', category, statusCode },
        level,
        category,
        statusCode
    )

    return NextResponse.json({
        success:    true,
        message:    `Test ${level.toUpperCase()} [${category}] ${statusCode ? `HTTP ${statusCode}` : ''} log written`.trim()
    })
}
