import mongoose from 'mongoose'

const TIMEOUT_MS = 3000

/**
 * Wraps a promise with a hard timeout.
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise<{ok:boolean, latencyMs:number, error?:string}>}
 */
async function probe(promise) {
    const t0 = Date.now()
    try {
        await Promise.race([
            promise,
            new Promise((_, rej) =>
                setTimeout(() => rej(new Error('Timeout')), TIMEOUT_MS)
            )
        ])
        return { ok: true, latencyMs: Date.now() - t0 }
    } catch (err) {
        return { ok: false, latencyMs: Date.now() - t0, error: err.message }
    }
}

/**
 * Check MongoDB via current mongoose connection state.
 * readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
 */
async function checkMongoDB() {
    const t0 = Date.now()
    const state = mongoose.connection.readyState
    const ok = state === 1
    return {
        ok,
        latencyMs: Date.now() - t0,
        detail: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown'
    }
}

/** Ping Clerk API */
async function checkClerk() {
    return probe(
        fetch('https://api.clerk.com', { method: 'HEAD', cache: 'no-store' })
    )
}

/** Ping Cloudinary API */
async function checkCloudinary() {
    return probe(
        fetch('https://api.cloudinary.com', { method: 'HEAD', cache: 'no-store' })
    )
}

/** Ping Razorpay API */
async function checkRazorpay() {
    return probe(
        fetch('https://api.razorpay.com', { method: 'HEAD', cache: 'no-store' })
    )
}

/** Ping Inngest API */
async function checkInngest() {
    return probe(
        fetch('https://api.inngest.com', { method: 'HEAD', cache: 'no-store' })
    )
}

/**
 * Run all probes concurrently.
 * @returns {Promise<Record<string, {ok:boolean, latencyMs:number, error?:string}>>}
 */
export async function runHealthChecks() {
    const [mongo, clerk, cloudinary, razorpay, inngest] = await Promise.all([
        checkMongoDB(),
        checkClerk(),
        checkCloudinary(),
        checkRazorpay(),
        checkInngest(),
    ])

    return { mongo, clerk, cloudinary, razorpay, inngest }
}
