import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import authAdmin from '@/lib/authAdmin'
import { getAuth } from '@clerk/nextjs/server'

// GET /api/admin/logs/test?level=error|warn|info
// Fires a test log entry at the specified level so you can verify the logs UI
export async function GET(request) {
    const { userId } = getAuth(request)
    if (!userId || !(await authAdmin(userId))) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const level = ['error', 'warn', 'info'].includes(searchParams.get('level'))
        ? searchParams.get('level')
        : 'info'

    const messages = {
        error: 'Test ERROR — simulated server exception',
        warn: 'Test WARN — simulated auth/permission warning',
        info: 'Test INFO — simulated informational event'
    }

    const fakeError = new Error(messages[level])
    // Only errors should show a stack trace — warn/info are controlled events
    if (level === 'error') {
        fakeError.stack = `Error: ${messages[level]}\n    at TestEndpoint (/api/admin/logs/test/route.js:1:1)\n    at AdminPanel (manual test trigger)`
    } else {
        fakeError.stack = undefined
    }

    await logError('/api/admin/logs/test', fakeError, userId, { triggeredBy: 'admin-test' }, level)

    return NextResponse.json({ success: true, message: `Test ${level.toUpperCase()} log written` })
}
