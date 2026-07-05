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
export async function logAudit(action, resource, userId = '', resourceId = '', metadata = {}) {
    try {
        await connectDB()
        await AuditLog.create({ action, resource, userId, resourceId, metadata })
    } catch (_) {
        // Audit logging must never break the main flow
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
