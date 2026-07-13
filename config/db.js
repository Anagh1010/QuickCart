import mongoose from "mongoose";
import { trackPerf } from '@/lib/logger'

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

/**
 * After connecting, sync the ErrorLog TTL index with the saved LogSettings value.
 * This ensures a DB reset doesn't silently revert the index back to the schema default.
 * Runs only once per cold start (cached.conn guards subsequent calls).
 */
async function syncTtlIndex(db) {
    try {
        const settings = await db.collection('logsettings').findOne({ _id: 'default' })
        const ttlDays = settings?.ttlDays
        if (!ttlDays || ttlDays === 90) return  // no-op — matches schema default

        await db.command({
            collMod: 'errorlogs',
            index: { keyPattern: { createdAt: 1 }, expireAfterSeconds: ttlDays * 24 * 60 * 60 }
        })
    } catch (_) {
        // Non-critical — the schema default (90 days) still applies if this fails
    }
}

async function connectDB() {

    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = { bufferCommands: false }

        cached.promise = trackPerf(
                'mongodb.connect',
                () => mongoose.connect(`${process.env.MONGODB_URI}/quickcart`, opts),
                '/config/db',
                '',
                3000   // cold-start connections are expected to take ~1s; warn above 3s
            )
            .then(async m => {
                await syncTtlIndex(m.connection.db)
                return m
            })
            .catch(err => {
                cached.promise = null
                console.error('[connectDB] MongoDB connection failed:', err.message)
                throw err
            })
    }

    cached.conn = await cached.promise
    return cached.conn

}

export default connectDB