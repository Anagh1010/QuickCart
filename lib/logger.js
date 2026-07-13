import connectDB from '@/config/db'
import ErrorLog from '@/models/ErrorLog'
import LogSettings from '@/models/LogSettings'

// In-memory cache so we don't query LogSettings on every logError() call
let _cache = { enabled: true, expiresAt: 0 }
const CACHE_TTL_MS = 60_000  // refresh at most once per minute

async function isLoggingEnabled() {
    const now = Date.now()
    if (now < _cache.expiresAt) return _cache.enabled  // cache hit

    try {
        await connectDB()
        const settings = await LogSettings.findById('default').lean()
        _cache = {
            enabled:   settings?.loggingEnabled ?? true,
            expiresAt: now + CACHE_TTL_MS
        }
    } catch (_) {
        // If we can't read settings, default to enabled so errors aren't silently lost
        _cache = { enabled: true, expiresAt: now + CACHE_TTL_MS }
    }
    return _cache.enabled
}

/** Call this after toggling the setting so the next logError() picks it up immediately */
export function invalidateLoggingCache() {
    _cache.expiresAt = 0
}

/**
 * Log an error to MongoDB.
 * Safe to call from any API route — never throws.
 * No-op when logging is disabled by the admin.
 * @param {string} route
 * @param {Error|string} error
 * @param {string} [userId]
 * @param {Object} [metadata]
 * @param {'error'|'warn'|'info'} [level]
 * @param {'api'|'database'|'auth'|'storage'|'performance'|'infra'|'client'} [category]
 * @param {number|null} [statusCode]
 */
export async function logError(route, error, userId = '', metadata = {}, level = 'error', category = 'api', statusCode = null) {
    try {
        if (!(await isLoggingEnabled())) return  // logging is turned off

        await connectDB()
        await ErrorLog.create({
            level,
            category,
            statusCode,
            message: error?.message || String(error),
            stack:   error?.stack   || '',
            route,
            userId,
            metadata
        })
    } catch (_) {
        // Silently fail — logging must never break the main flow
    }
}

/**
 * Wrap any async operation and automatically log a performance warning
 * if it takes longer than `thresholdMs` (default 1500ms).
 *
 * Usage:
 *   const result = await trackPerf('cloudinary.upload', () => cloudinary.uploader..., '/api/product/add', userId)
 *
 * @param {string} label          - Human-readable name for what is being timed (e.g. 'mongodb.connect', 'clerk.getUser')
 * @param {() => Promise<any>} fn - The async operation to run and measure
 * @param {string} [route]        - API route context for the log
 * @param {string} [userId]       - Current user ID for the log
 * @param {number} [thresholdMs]  - Warn threshold in milliseconds (default: 1500)
 * @returns {Promise<any>}        - Resolves with fn()'s return value; never swallows errors
 */
export async function trackPerf(label, fn, route = '', userId = '', thresholdMs = 1500) {
    const t0 = Date.now()
    try {
        return await fn()
    } finally {
        const elapsed = Date.now() - t0
        if (elapsed > thresholdMs) {
            // Fire-and-forget — we don't want a slow log write to slow down the response further
            logError(
                route,
                new Error(`${label} took ${elapsed}ms (threshold: ${thresholdMs}ms)`),
                userId,
                { label, elapsedMs: elapsed, thresholdMs },
                'warn',
                'performance',
                null
            ).catch(() => {})
        }
    }
}
