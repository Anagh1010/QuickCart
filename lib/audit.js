import connectDB from '@/config/db'
import AuditLog from '@/models/AuditLog'

/**
 * Record a user action to the AuditLog collection.
 *
 * IMPORTANT — Serverless-safe: we intentionally DO NOT use fire-and-forget
 * because Vercel terminates function execution immediately after the response
 * is sent, killing any detached promises before they complete. Instead callers
 * should await this at the end of the happy path, just before returning the
 * response. It is designed to be fast (single indexed insert ~2ms) and will
 * never throw — failures are silently swallowed so the main flow is never broken.
 *
 * @param {string} action       - 'product.listed' | 'cart.updated' | ...
 * @param {string} resource     - 'product' | 'cart' | 'order' | 'coupon' | 'user' | 'seller'
 * @param {string} [userId]     - Clerk userId — '' for anonymous
 * @param {string} [resourceId] - ID of the specific resource
 * @param {Object} [metadata]   - Extra context
 */
const SENSITIVE_KEYS = new Set([
    'password', 'token', 'authorization', 'cookie', 'signature', 'razorpaySignature',
    'razorpayPaymentId', 'card', 'cvv', 'address', 'email', 'phone'
])

function redact(value) {
    if (Array.isArray(value)) return value.map(redact)
    if (!value || typeof value !== 'object') return value
    if (value instanceof Date) return value
    if (value.constructor?.name === 'ObjectId') return value.toString()

    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redact(item)
    ]))
}

/**
 * Build a privacy-limited request context. Pass this to logAudit as options.request.
 */
export function getAuditRequestContext(request) {
    const headers = request?.headers
    return {
        id: headers?.get('x-request-id') || headers?.get('x-vercel-id') || '',
        route: request?.nextUrl?.pathname || new URL(request.url).pathname,
        method: request?.method || '',
        ip: (headers?.get('x-forwarded-for') || '').split(',')[0].trim(),
        userAgent: (headers?.get('user-agent') || '').slice(0, 300),
    }
}

/**
 * The positional arguments preserve existing call sites. Use options for new fields:
 * { category, outcome, actorRole, resourceLabel, changes, request }.
 */
export async function logAudit(action, resource, userId = '', resourceId = '', metadata = {}, options = {}) {
    try {
        await connectDB()
        await AuditLog.create({
            eventVersion: 1,
            action,
            category: options.category || 'audit',
            outcome: options.outcome || 'success',
            resource,
            resourceId,
            resourceLabel: options.resourceLabel || '',
            userId,
            actor: {
                id: userId,
                role: options.actorRole || '',
                type: options.actorType || (userId ? 'user' : 'anonymous'),
            },
            request: options.request || {},
            changes: redact(options.changes || {}),
            metadata: redact(metadata),
        })
    } catch (_) {
        // Audit logging must never break the customer request. Production should alert
        // on this failure through database/runtime monitoring.
    }
}

/**
 * Deduplication guard for high-frequency actions like user.session_started.
 * Returns true if an audit event for this userId+action already exists
 * within the last `windowMinutes` minutes.
 */
export async function hasRecentAudit(action, userId, windowMinutes = 30) {
    try {
        await connectDB()
        const since = new Date(Date.now() - windowMinutes * 60_000)
        const exists = await AuditLog.exists({ action, userId, createdAt: { $gte: since } })
        return !!exists
    } catch (_) {
        return false  // on error, don't deduplicate — better to log twice than miss
    }
}
