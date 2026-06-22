import connectDB from '@/config/db'
import ErrorLog from '@/models/ErrorLog'

/**
 * Log an error to MongoDB.
 * Safe to call from any API route — never throws.
 * @param {string} route  - API route path e.g. '/api/product/add'
 * @param {Error|string} error
 * @param {string} [userId]
 * @param {Object} [metadata]
 * @param {'error'|'warn'|'info'} [level]
 */
export async function logError(route, error, userId = '', metadata = {}, level = 'error') {
    try {
        await connectDB()
        await ErrorLog.create({
            level,
            message: error?.message || String(error),
            stack: error?.stack || '',
            route,
            userId,
            metadata
        })
    } catch (_) {
        // Silently fail — logging must never break the main flow
    }
}
