'use client'

/**
 * clientLogger.js
 * Browser-side performance reporter.
 *
 * Usage (call once in a layout or AppContext):
 *   import { initClientLogger } from '@/lib/clientLogger'
 *   initClientLogger(userId) // pass Clerk userId if available
 *
 * Reports:
 * - Web Vitals: LCP, FID, CLS, TTFB, INP (via PerformanceObserver)
 * - Slow API calls: any fetch > SLOW_API_THRESHOLD_MS ms
 */

const SLOW_API_THRESHOLD_MS = 2000
const ENDPOINT = '/api/log/client'

let _userId = ''

function send(payload) {
    // Use sendBeacon when available (non-blocking, survives page unload)
    const data = JSON.stringify({ ...payload, userId: _userId })
    if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([data], { type: 'application/json' }))
    } else {
        fetch(ENDPOINT, { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true })
            .catch(() => {})
    }
}

/** Observe a single PerformanceObserver entry type */
function observeVital(type, handler) {
    try {
        const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) handler(entry)
        })
        observer.observe({ type, buffered: true })
    } catch (_) {}
}

/** Patch global fetch to detect slow API calls */
function patchFetch() {
    const _fetch = window.fetch
    window.fetch = async function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
        // Only instrument internal API calls
        if (!url.startsWith('/api/')) return _fetch(...args)

        const t0 = performance.now()
        try {
            const res = await _fetch(...args)
            const elapsed = Math.round(performance.now() - t0)
            if (elapsed >= SLOW_API_THRESHOLD_MS) {
                send({ metric: 'slowApi', value: elapsed, page: window.location.pathname, extra: { url } })
            }
            return res
        } catch (err) {
            const elapsed = Math.round(performance.now() - t0)
            send({ metric: 'slowApi', value: elapsed, page: window.location.pathname, extra: { url, error: err.message } })
            throw err
        }
    }
}

/**
 * Initialise the client logger. Call once after the user is known.
 * @param {string} [userId] - Clerk user ID (optional)
 */
export function initClientLogger(userId = '') {
    if (typeof window === 'undefined') return // SSR guard
    _userId = userId

    // LCP — Largest Contentful Paint
    observeVital('largest-contentful-paint', entry => {
        send({ metric: 'LCP', value: Math.round(entry.startTime), page: window.location.pathname })
    })

    // CLS — Cumulative Layout Shift
    let clsValue = 0
    observeVital('layout-shift', entry => {
        if (!entry.hadRecentInput) clsValue += entry.value
    })
    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && clsValue > 0) {
            send({ metric: 'CLS', value: parseFloat(clsValue.toFixed(4)), page: window.location.pathname })
        }
    }, { once: true })

    // FID — First Input Delay
    observeVital('first-input', entry => {
        send({ metric: 'FID', value: Math.round(entry.processingStart - entry.startTime), page: window.location.pathname })
    })

    // INP — Interaction to Next Paint
    observeVital('event', entry => {
        if (entry.duration > 0) {
            send({ metric: 'INP', value: Math.round(entry.duration), page: window.location.pathname })
        }
    })

    // TTFB — Time to First Byte (from navigation timing)
    observeVital('navigation', entry => {
        send({ metric: 'TTFB', value: Math.round(entry.responseStart - entry.requestStart), page: window.location.pathname })
    })

    // Slow API detection
    patchFetch()
}
