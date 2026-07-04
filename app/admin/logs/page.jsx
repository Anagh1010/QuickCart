'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

// ── Styles ────────────────────────────────────────────────────────────────────
const levelStyles = {
    error: 'bg-red-50 text-red-600 border border-red-200',
    warn:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
    info:  'bg-blue-50 text-blue-600 border border-blue-200'
}

const categoryStyles = {
    api:         'bg-gray-100 text-gray-600',
    database:    'bg-purple-100 text-purple-700',
    auth:        'bg-orange-100 text-orange-700',
    storage:     'bg-sky-100 text-sky-700',
    infra:       'bg-indigo-100 text-indigo-700',
    performance: 'bg-teal-100 text-teal-700',
    client:      'bg-pink-100 text-pink-700',
}

const statusCodeStyle = (code) => {
    if (!code) return 'bg-gray-100 text-gray-400'
    if (code >= 500) return 'bg-red-100 text-red-700'
    if (code >= 400) return 'bg-orange-100 text-orange-700'
    if (code >= 300) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
}

const LevelBadge = ({ level }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${levelStyles[level] || levelStyles.info}`}>
        {level?.toUpperCase()}
    </span>
)

const CategoryBadge = ({ category }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryStyles[category] || 'bg-gray-100 text-gray-500'}`}>
        {category}
    </span>
)

const StatusCodeBadge = ({ code }) => code ? (
    <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${statusCodeStyle(code)}`}>
        {code}
    </span>
) : null

// ── Health Panel ──────────────────────────────────────────────────────────────
const SERVICE_LABELS = {
    mongo:      { label: 'MongoDB',    icon: '🗄️' },
    clerk:      { label: 'Clerk',      icon: '🔐' },
    cloudinary: { label: 'Cloudinary', icon: '☁️' },
    razorpay:   { label: 'Razorpay',   icon: '💳' },
    inngest:    { label: 'Inngest',    icon: '⚙️' },
}

function HealthPanel({ getToken }) {
    const [health, setHealth] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchHealth = useCallback(async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/health', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) setHealth(data)
        } catch {
            toast.error('Health check failed')
        } finally {
            setLoading(false)
        }
    }, [getToken])

    useEffect(() => { fetchHealth() }, [fetchHealth])

    const allOk = health?.healthy

    return (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-xs p-5'>
            <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                    <span className={`w-2.5 h-2.5 rounded-full ${allOk ? 'bg-green-400' : 'bg-red-400'} ${loading ? 'animate-pulse' : ''}`} />
                    <h3 className='text-sm font-semibold text-gray-800'>Live Infrastructure Health</h3>
                    {health?.timestamp && (
                        <span className='text-xs text-gray-400'>
                            · checked {new Date(health.timestamp).toLocaleTimeString()}
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchHealth}
                    disabled={loading}
                    className='text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-lg hover:border-orange-400 transition-colors disabled:opacity-50'
                >
                    {loading ? 'Checking…' : 'Re-check'}
                </button>
            </div>

            {loading && !health ? (
                <div className='flex items-center gap-2 text-xs text-gray-400 py-2'>
                    <div className='animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full' />
                    Running probes…
                </div>
            ) : health ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                    {Object.entries(health.services).map(([key, status]) => {
                        const meta = SERVICE_LABELS[key] || { label: key, icon: '🔌' }
                        return (
                            <div
                                key={key}
                                className={`flex flex-col gap-1 rounded-xl border p-3 ${status.ok
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'
                                }`}
                            >
                                <div className='flex items-center gap-1.5'>
                                    <span className='text-base'>{meta.icon}</span>
                                    <span className='text-xs font-semibold text-gray-700'>{meta.label}</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className={`w-2 h-2 rounded-full ${status.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <span className={`text-xs font-medium ${status.ok ? 'text-green-700' : 'text-red-600'}`}>
                                        {status.ok ? 'Healthy' : 'Degraded'}
                                    </span>
                                </div>
                                <span className='text-[10px] text-gray-400'>{status.latencyMs}ms</span>
                                {!status.ok && status.error && (
                                    <span className='text-[10px] text-red-500 truncate' title={status.error}>{status.error}</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminLogsPage() {
    const { getToken } = useAppContext()
    const [logs, setLogs]     = useState([])
    const [total, setTotal]   = useState(0)
    const [pages, setPages]   = useState(1)
    const [loading, setLoading]   = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [filters, setFilters] = useState({ level: 'all', category: 'all', statusCode: 'all', route: '', page: 1 })
    const [ttlDays, setTtlDays]           = useState(90)
    const [ttlInput, setTtlInput]         = useState(90)
    const [savingTtl, setSavingTtl]       = useState(false)
    const [loggingEnabled, setLoggingEnabled] = useState(true)
    const [togglingLog, setTogglingLog]   = useState(false)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const params = new URLSearchParams({
                page: filters.page,
                limit: 50,
                ...(filters.level      !== 'all' && { level:      filters.level }),
                ...(filters.category   !== 'all' && { category:   filters.category }),
                ...(filters.statusCode !== 'all' && { statusCode: filters.statusCode }),
                ...(filters.route               && { route:       filters.route })
            })
            const { data } = await axios.get(`/api/admin/logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setLogs(data.logs)
                setTotal(data.total)
                setPages(data.pages)
            }
        } catch {
            toast.error('Failed to load logs')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    // Fetch current TTL setting on mount
    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/admin/logs/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (data.success) {
                    setTtlDays(data.ttlDays)
                    setTtlInput(data.ttlDays)
                    setLoggingEnabled(data.loggingEnabled)
                }
            } catch { /* non-critical */ }
        })()
    }, [])

    const handleSaveTtl = async () => {
        const days = parseInt(ttlInput)
        if (isNaN(days) || days < 1 || days > 365) return toast.error('TTL must be between 1 and 365 days')
        setSavingTtl(true)
        try {
            const token = await getToken()
            const { data } = await axios.patch('/api/admin/logs/settings', { ttlDays: days }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setTtlDays(data.ttlDays)
                setTtlInput(data.ttlDays)
                toast.success(`Auto-purge set to ${data.ttlDays} days`)
            }
        } catch {
            toast.error('Failed to update TTL')
        } finally {
            setSavingTtl(false)
        }
    }

    const handleToggleLogging = async () => {
        setTogglingLog(true)
        try {
            const token = await getToken()
            const { data } = await axios.patch('/api/admin/logs/settings',
                { loggingEnabled: !loggingEnabled },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
                setLoggingEnabled(data.loggingEnabled)
                toast.success(data.loggingEnabled ? 'Error logging enabled' : 'Error logging disabled')
            }
        } catch {
            toast.error('Failed to update logging state')
        } finally {
            setTogglingLog(false)
        }
    }

    const handleClearOld = async (days) => {
        if (!confirm(`Delete all logs older than ${days} days?`)) return
        setDeleting(true)
        try {
            const token = await getToken()
            const { data } = await axios.delete(`/api/admin/logs?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                toast.success(`Deleted ${data.deleted} old log entries`)
                fetchLogs()
            }
        } catch {
            toast.error('Failed to delete logs')
        } finally {
            setDeleting(false)
        }
    }

    const fireTestLog = async (level, category = 'api', statusCode = null) => {
        try {
            const token = await getToken()
            const params = new URLSearchParams({ level, category, ...(statusCode && { statusCode }) })
            const { data } = await axios.get(`/api/admin/logs/test?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                toast.success(data.message)
                setTimeout(fetchLogs, 500)
            }
        } catch {
            toast.error('Failed to fire test log')
        }
    }

    const [migrating, setMigrating] = useState(false)
    const handleMigrate = async () => {
        if (!confirm('Tag all existing logs with inferred category + status code?\nThis is safe to run multiple times.')) return
        setMigrating(true)
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/admin/logs/migrate', {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                toast.success(data.message)
                fetchLogs()
            }
        } catch {
            toast.error('Migration failed')
        } finally {
            setMigrating(false)
        }
    }

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-6'>

                {/* Header */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-950'>Error Logs</h2>
                        <p className='text-xs text-gray-500 font-medium mt-1'>
                            {total} total log entries · auto-purged after {ttlDays} days
                        </p>
                    </div>
                    <div className='flex flex-wrap gap-2 items-center'>

                        {/* Logging on/off toggle */}
                        <button
                            onClick={handleToggleLogging}
                            disabled={togglingLog}
                            title={loggingEnabled ? 'Click to disable logging' : 'Click to enable logging'}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50 ${
                                loggingEnabled
                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                    : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${
                                togglingLog ? 'animate-pulse bg-gray-400' :
                                loggingEnabled ? 'bg-green-500' : 'bg-red-400'
                            }`} />
                            {togglingLog ? 'Updating…' : loggingEnabled ? 'Logging ON' : 'Logging OFF'}
                        </button>
                        {/* Test buttons — level × category */}
                        <div className='flex flex-wrap gap-1.5 items-center'>
                            <span className='text-xs text-gray-400 font-medium'>Test:</span>
                            {[
                                { level: 'error', category: 'api',      statusCode: 500, label: 'API 500',    cls: 'text-red-600 border-red-200 hover:bg-red-50' },
                                { level: 'error', category: 'database', statusCode: 503, label: 'DB 503',     cls: 'text-purple-600 border-purple-200 hover:bg-purple-50' },
                                { level: 'warn',  category: 'auth',     statusCode: 403, label: 'Auth 403',   cls: 'text-orange-600 border-orange-200 hover:bg-orange-50' },
                                { level: 'error', category: 'storage',  statusCode: 502, label: 'CDN 502',    cls: 'text-sky-600 border-sky-200 hover:bg-sky-50' },
                                { level: 'error', category: 'infra',    statusCode: 503, label: 'Infra 503',  cls: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50' },
                                { level: 'info',  category: 'client',   statusCode: null, label: 'Client',    cls: 'text-pink-600 border-pink-200 hover:bg-pink-50' },
                            ].map(({ level, category, statusCode, label, cls }) => (
                                <button
                                    key={label}
                                    onClick={() => fireTestLog(level, category, statusCode)}
                                    className={`text-xs border bg-white px-2.5 py-1.5 rounded-xl transition-colors font-semibold ${cls}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handleClearOld(30)}
                            disabled={deleting}
                            className='text-xs text-red-500 border border-red-200 bg-white px-4 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50'
                        >
                            {deleting ? 'Clearing…' : 'Clear > 30 days'}
                        </button>

                        {/* Tag existing logs */}
                        <button
                            onClick={handleMigrate}
                            disabled={migrating}
                            className='text-xs text-indigo-600 border border-indigo-200 bg-white px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50'
                        >
                            {migrating ? 'Tagging…' : '🏷 Tag Existing Logs'}
                        </button>

                        {/* TTL configurator */}
                        <div className='flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-1.5'>
                            <span className='text-xs text-gray-400 whitespace-nowrap'>Auto-purge after</span>
                            <input
                                type='number'
                                min={1}
                                max={365}
                                value={ttlInput}
                                onChange={e => setTtlInput(e.target.value)}
                                className='w-14 text-xs text-center border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:border-orange-400'
                            />
                            <span className='text-xs text-gray-400'>days</span>
                            <button
                                onClick={handleSaveTtl}
                                disabled={savingTtl || parseInt(ttlInput) === ttlDays}
                                className='text-xs font-semibold text-orange-500 border border-orange-200 bg-orange-50 px-2 py-1 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-40'
                            >
                                {savingTtl ? '…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logging disabled warning */}
                {!loggingEnabled && (
                    <div className='flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3'>
                        <span className='text-lg'>🔕</span>
                        <div className='flex-1'>
                            <p className='text-sm font-semibold text-red-700'>Error logging is currently OFF</p>
                            <p className='text-xs text-red-500 mt-0.5'>No new errors are being recorded. Click <strong>Logging OFF</strong> above to re-enable.</p>
                        </div>
                    </div>
                )}

                {/* Live Health Panel */}
                <HealthPanel getToken={getToken} />


                {/* Filters */}
                <div className='flex flex-wrap gap-3'>
                    <select
                        value={filters.level}
                        onChange={e => setFilters(f => ({ ...f, level: e.target.value, page: 1 }))}
                        className='border border-gray-200 bg-white text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400'
                    >
                        <option value='all'>All Levels</option>
                        <option value='error'>Error</option>
                        <option value='warn'>Warning</option>
                        <option value='info'>Info</option>
                    </select>

                    <select
                        value={filters.category}
                        onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
                        className='border border-gray-200 bg-white text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400'
                    >
                        <option value='all'>All Categories</option>
                        <option value='api'>API</option>
                        <option value='database'>Database</option>
                        <option value='auth'>Auth</option>
                        <option value='storage'>Storage</option>
                        <option value='infra'>Infra</option>
                        <option value='performance'>Performance</option>
                        <option value='client'>Client</option>
                    </select>

                    <select
                        value={filters.statusCode}
                        onChange={e => setFilters(f => ({ ...f, statusCode: e.target.value, page: 1 }))}
                        className='border border-gray-200 bg-white text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400'
                    >
                        <option value='all'>All Status Codes</option>
                        <option value='4xx'>4xx Client Errors</option>
                        <option value='5xx'>5xx Server Errors</option>
                        <option value='400'>400 Bad Request</option>
                        <option value='401'>401 Unauthorized</option>
                        <option value='403'>403 Forbidden</option>
                        <option value='404'>404 Not Found</option>
                        <option value='500'>500 Internal Error</option>
                        <option value='502'>502 Bad Gateway</option>
                        <option value='503'>503 Service Unavailable</option>
                    </select>

                    <input
                        type='text'
                        placeholder='Filter by route…'
                        value={filters.route}
                        onChange={e => setFilters(f => ({ ...f, route: e.target.value, page: 1 }))}
                        className='border border-gray-200 bg-white text-gray-700 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 w-56'
                    />
                    <button
                        onClick={fetchLogs}
                        className='px-4 py-2.5 bg-white border border-gray-200 hover:border-orange-400 text-gray-600 rounded-xl text-sm transition-colors'
                    >
                        Refresh
                    </button>
                </div>

                {/* Log List */}
                <div className='bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden'>
                    {loading ? (
                        <div className='flex items-center justify-center h-64'>
                            <div className='animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full' />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className='text-center py-16 text-gray-400'>
                            <p className='text-4xl mb-3'>✅</p>
                            <p>No logs found for current filters</p>
                        </div>
                    ) : (
                        <div className='divide-y divide-gray-100'>
                            {logs.map((log) => (
                                <div key={log._id} className='px-6 py-4 hover:bg-gray-50 transition-colors'>
                                    <div
                                        className='flex items-start gap-3 cursor-pointer'
                                        onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                                    >
                                        <LevelBadge level={log.level} />
                                        {log.category   && <CategoryBadge   category={log.category} />}
                                        {log.statusCode && <StatusCodeBadge code={log.statusCode} />}
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-gray-800 text-sm font-medium truncate'>{log.message}</p>
                                            <div className='flex flex-wrap gap-3 mt-1 text-xs text-gray-400'>
                                                {log.route  && <span>📍 {log.route}</span>}
                                                {log.userId && <span>👤 {log.userId.slice(0, 20)}…</span>}
                                                <span>🕒 {new Date(log.createdAt).toLocaleString()}</span>
                                                {log.metadata?.latencyMs != null && (
                                                    <span>⏱ {log.metadata.latencyMs}ms</span>
                                                )}
                                                {log.metadata?.metric && (
                                                    <span>📊 {log.metadata.metric} = {log.metadata.value}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className='text-gray-400 text-xs mt-1'>{expanded === log._id ? '▲' : '▼'}</span>
                                    </div>
                                    {expanded === log._id && (
                                        <div className='mt-3 space-y-2'>
                                            {log.stack && (
                                                <pre className='p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-red-500 font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto'>
                                                    {log.stack}
                                                </pre>
                                            )}
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <pre className='p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-mono overflow-x-auto whitespace-pre-wrap'>
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div className='flex justify-center gap-2'>
                        <button
                            disabled={filters.page <= 1}
                            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                            className='px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-orange-400 disabled:opacity-40 transition-colors'
                        >
                            ← Prev
                        </button>
                        <span className='px-4 py-2 text-gray-500 text-sm'>
                            Page {filters.page} of {pages}
                        </span>
                        <button
                            disabled={filters.page >= pages}
                            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                            className='px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-orange-400 disabled:opacity-40 transition-colors'
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
