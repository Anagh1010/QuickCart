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
