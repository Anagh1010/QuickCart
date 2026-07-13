'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useAppContext } from '@/context/AppContext'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const ACTION_LABELS = {
    'product.listed':          { label: 'Products Browsed',  icon: '🛍',  color: 'bg-blue-100 text-blue-700' },
    'product.added':           { label: 'Product Added',     icon: '📦',  color: 'bg-green-100 text-green-700' },
    'cart.viewed':             { label: 'Cart Viewed',       icon: '🛒',  color: 'bg-yellow-100 text-yellow-700' },
    'cart.updated':            { label: 'Cart Updated',      icon: '✏️',  color: 'bg-orange-100 text-orange-700' },
    'order.created':           { label: 'Order Placed',      icon: '🧾',  color: 'bg-purple-100 text-purple-700' },
    'order.viewed':            { label: 'Orders Viewed',     icon: '📋',  color: 'bg-indigo-100 text-indigo-700' },
    'coupon.validated':        { label: 'Coupon Used',       icon: '🎟',  color: 'bg-pink-100 text-pink-700' },
    'user.session_started':    { label: 'User Login',        icon: '👤',  color: 'bg-teal-100 text-teal-700' },
    'seller.analytics_viewed': { label: 'Analytics Viewed', icon: '📊',  color: 'bg-gray-100 text-gray-700' },
}

const ActionBadge = ({ action }) => {
    const meta = ACTION_LABELS[action] || { label: action, icon: '•', color: 'bg-gray-100 text-gray-600' }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
            <span>{meta.icon}</span> {meta.label}
        </span>
    )
}

const StatCard = ({ label, value, sub }) => (
    <div className='bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-1'>
        <p className='text-xs text-gray-400 font-medium'>{label}</p>
        <p className='text-3xl font-bold text-gray-900'>{value?.toLocaleString() ?? '—'}</p>
        {sub && <p className='text-xs text-gray-400'>{sub}</p>}
    </div>
)

// ── Pure-CSS bar ──────────────────────────────────────────────────────────────
const MiniBar = ({ value, max }) => (
    <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden w-full'>
        <div
            className='h-full bg-orange-400 rounded-full transition-all duration-500'
            style={{ width: max ? `${Math.round((value / max) * 100)}%` : '0%' }}
        />
    </div>
)

// ── Inline SVG sparkline ──────────────────────────────────────────────────────
const Sparkline = ({ data }) => {
    if (!data?.length) return null
    const counts = data.map(d => d.count)
    const max    = Math.max(...counts, 1)
    const w = 280, h = 48, pad = 4
    const pts = counts.map((v, i) => {
        const x = pad + (i / (counts.length - 1 || 1)) * (w - pad * 2)
        const y = h - pad - ((v / max) * (h - pad * 2))
        return `${x},${y}`
    }).join(' ')

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className='w-full h-12'>
            <polyline fill='none' stroke='#f97316' strokeWidth='2'
                strokeLinejoin='round' strokeLinecap='round' points={pts} />
            {counts.map((v, i) => {
                const x = pad + (i / (counts.length - 1 || 1)) * (w - pad * 2)
                const y = h - pad - ((v / max) * (h - pad * 2))
                return <circle key={i} cx={x} cy={y} r='2.5' fill='#f97316' />
            })}
        </svg>
    )
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return debounced
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const ALL_ACTIONS   = Object.keys(ACTION_LABELS)
const ALL_RESOURCES = ['product', 'cart', 'order', 'coupon', 'user', 'seller']

export default function AdminAuditPage() {
    const { getToken } = useAppContext()

    // Summary state
    const [summary,    setSummary]    = useState(null)
    const [topActions, setTopActions] = useState([])
    const [topUsers,   setTopUsers]   = useState([])
    const [timeline,   setTimeline]   = useState([])
    const [totalAll,   setTotalAll]   = useState(0)  // unfiltered total from summary
    const [loadingSum, setLoadingSum] = useState(true)

    // Feed state
    const [logs,        setLogs]        = useState([])
    const [feedTotal,   setFeedTotal]   = useState(0)
    const [pages,       setPages]       = useState(1)
    const [loadingFeed, setLoadingFeed] = useState(true)

    // Filters — userIdInput is the raw text; debouncedUserId triggers the fetch
    const [actionFilter,   setActionFilter]   = useState('')
    const [resourceFilter, setResourceFilter] = useState('')
    const [userIdInput,    setUserIdInput]     = useState('')
    const [page,           setPage]           = useState(1)
    const debouncedUserId = useDebounce(userIdInput, 400)

    // Fetch summary once on mount
    useEffect(() => {
        (async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/admin/audit?view=summary', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (data.success) {
                    setSummary(data.summary)
                    setTopActions(data.topActions)
                    setTopUsers(data.topUsers)
                    setTimeline(data.timeline)
                    setTotalAll(data.summary.total30d) // use 30-day as "recent total" in header
                }
            } catch { toast.error('Failed to load audit summary') }
            finally  { setLoadingSum(false) }
        })()
    }, [])

    // Fetch feed whenever filters or page changes
    const fetchFeed = useCallback(async () => {
        setLoadingFeed(true)
        try {
            const token = await getToken()
            const params = new URLSearchParams({
                view: 'feed', page, limit: 50,
                ...(actionFilter    && { action:   actionFilter }),
                ...(resourceFilter  && { resource: resourceFilter }),
                ...(debouncedUserId && { userId:   debouncedUserId }),
            })
            const { data } = await axios.get(`/api/admin/audit?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setLogs(data.logs)
                setFeedTotal(data.total)
                setPages(data.pages)
            }
        } catch { toast.error('Failed to load activity feed') }
        finally  { setLoadingFeed(false) }
    }, [actionFilter, resourceFilter, debouncedUserId, page])

    useEffect(() => { fetchFeed() }, [fetchFeed])

    // When any filter changes, reset to page 1
    const setFilter = (key, value) => {
        setPage(1)
        if (key === 'action')   setActionFilter(value)
        if (key === 'resource') setResourceFilter(value)
        if (key === 'userId')   setUserIdInput(value)
    }

    // Clicking a top-feature row filters the feed by that action
    const filterByAction = (action) => {
        setActionFilter(prev => prev === action ? '' : action)
        setPage(1)
    }

    const topMax = topActions[0]?.count || 1
    const isFiltered = actionFilter || resourceFilter || debouncedUserId

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to permanently delete ALL audit logs? This cannot be undone.')) return
        
        try {
            const token = await getToken()
            const { data } = await axios.delete('/api/admin/audit', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                toast.success(data.message)
                // Refresh data
                setSummary(null)
                setLoadingSum(true)
                const sumRes = await axios.get('/api/admin/audit?view=summary', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (sumRes.data.success) {
                    setSummary(sumRes.data.summary)
                    setTopActions(sumRes.data.topActions)
                    setTopUsers(sumRes.data.topUsers)
                    setTimeline(sumRes.data.timeline)
                    setTotalAll(sumRes.data.summary.total30d)
                }
                setLoadingSum(false)
                
                fetchFeed()
            } else {
                toast.error(data.message || 'Failed to clear logs')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Error clearing logs')
        }
    }

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                {/* Header */}
                <div className='flex items-center justify-between'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-950'>Audit Logs</h2>
                        <p className='text-xs text-gray-500 font-medium mt-1'>
                            {isFiltered
                                ? <>{feedTotal.toLocaleString()} matching events <span className='text-orange-400'>(filtered)</span></>
                                : <>{feedTotal.toLocaleString()} events in feed · tracks user access across all key features</>
                            }
                        </p>
                    </div>
                    <button 
                        onClick={handleClearLogs}
                        className='text-xs text-red-500 border border-red-200 bg-white px-4 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2'
                    >
                        <span>🗑️</span> Clear Logs
                    </button>
                </div>

                {/* Summary Cards */}
                {loadingSum ? (
                    <div className='grid grid-cols-3 gap-4'>
                        {[1,2,3].map(i => <div key={i} className='h-24 bg-gray-100 rounded-2xl animate-pulse' />)}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                        <StatCard label='Events Today'      value={summary?.totalToday} sub='last 24 hours' />
                        <StatCard label='Events This Week'  value={summary?.total7d}    sub='last 7 days' />
                        <StatCard label='Events This Month' value={summary?.total30d}   sub='last 30 days' />
                    </div>
                )}

                {/* Top Features + Sparkline */}
                {!loadingSum && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>

                        {/* Top Features — clicking filters the feed */}
                        <div className='bg-white border border-gray-200 rounded-2xl p-6'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-sm font-semibold text-gray-800'>Top Features</h3>
                                <span className='text-[10px] text-gray-400'>click to filter feed</span>
                            </div>
                            <div className='space-y-3'>
                                {topActions.map(({ _id, count }) => {
                                    const meta    = ACTION_LABELS[_id]
                                    const active  = actionFilter === _id
                                    return (
                                        <button
                                            key={_id}
                                            onClick={() => filterByAction(_id)}
                                            className={`w-full text-left space-y-1 rounded-xl px-2 py-1 transition-colors ${active ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className='flex items-center justify-between'>
                                                <span className='text-xs text-gray-700 font-medium flex items-center gap-1.5'>
                                                    <span>{meta?.icon || '•'}</span>
                                                    {meta?.label || _id}
                                                </span>
                                                <span className='text-xs font-bold text-gray-500 tabular-nums'>
                                                    {count.toLocaleString()}
                                                </span>
                                            </div>
                                            <MiniBar value={count} max={topMax} />
                                        </button>
                                    )
                                })}
                                {topActions.length === 0 && <p className='text-xs text-gray-400'>No events recorded yet</p>}
                            </div>
                        </div>

                        {/* 14-day Timeline */}
                        <div className='bg-white border border-gray-200 rounded-2xl p-6 flex flex-col'>
                            <h3 className='text-sm font-semibold text-gray-800 mb-1'>Activity — Last 14 Days</h3>
                            <p className='text-xs text-gray-400 mb-4'>Daily event volume</p>
                            <div className='flex-1 flex flex-col justify-end'>
                                <Sparkline data={timeline} />
                                {timeline.length > 0 && (
                                    <div className='flex justify-between mt-1'>
                                        <span className='text-[10px] text-gray-400'>{timeline[0]?._id}</span>
                                        <span className='text-[10px] text-gray-400'>{timeline[timeline.length - 1]?._id}</span>
                                    </div>
                                )}
                                {timeline.length === 0 && <p className='text-xs text-gray-400'>No data yet</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Active Users */}
                {!loadingSum && topUsers.length > 0 && (
                    <div className='bg-white border border-gray-200 rounded-2xl p-6'>
                        <h3 className='text-sm font-semibold text-gray-800 mb-4'>
                            Most Active Users <span className='text-gray-400 font-normal'>(last 30 days)</span>
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            {topUsers.map(({ _id, count }, i) => (
                                <button
                                    key={_id}
                                    onClick={() => setFilter('userId', userIdInput === _id ? '' : _id)}
                                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors text-left ${userIdInput === _id ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs font-bold text-gray-300 tabular-nums w-5'>#{i + 1}</span>
                                        <span className='text-xs text-gray-700 font-mono truncate max-w-[160px]' title={_id}>{_id}</span>
                                    </div>
                                    <span className='text-xs font-bold text-orange-500 tabular-nums'>{count} events</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Activity Feed */}
                <div className='bg-white border border-gray-200 rounded-2xl overflow-hidden'>
                    <div className='px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center'>
                        <h3 className='text-sm font-semibold text-gray-800 mr-auto'>
                            Activity Feed
                            {isFiltered && (
                                <button
                                    onClick={() => { setActionFilter(''); setResourceFilter(''); setUserIdInput(''); setPage(1) }}
                                    className='ml-2 text-[10px] text-orange-500 font-normal hover:underline'
                                >clear filters ×</button>
                            )}
                        </h3>

                        {/* Action filter */}
                        <select
                            value={actionFilter}
                            onChange={e => setFilter('action', e.target.value)}
                            className='border border-gray-200 bg-white text-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400'
                        >
                            <option value=''>All Actions</option>
                            {ALL_ACTIONS.map(a => (
                                <option key={a} value={a}>{ACTION_LABELS[a].icon} {ACTION_LABELS[a].label}</option>
                            ))}
                        </select>

                        {/* Resource filter */}
                        <select
                            value={resourceFilter}
                            onChange={e => setFilter('resource', e.target.value)}
                            className='border border-gray-200 bg-white text-gray-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400'
                        >
                            <option value=''>All Resources</option>
                            {ALL_RESOURCES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>

                        {/* User ID filter — debounced so it doesn't fetch on every keystroke */}
                        <input
                            type='text'
                            placeholder='Filter by User ID…'
                            value={userIdInput}
                            onChange={e => setFilter('userId', e.target.value)}
                            className='border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-400 w-44'
                        />
                    </div>

                    {/* Table */}
                    {loadingFeed ? (
                        <div className='space-y-2 p-6'>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className='h-10 bg-gray-100 rounded-xl animate-pulse' />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className='text-center py-16 text-gray-400 text-sm'>No audit events found</div>
                    ) : (
                        <div className='divide-y divide-gray-50'>
                            {logs.map(log => (
                                <div key={log._id} className='flex flex-wrap items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors'>
                                    <ActionBadge action={log.action} />
                                    <span
                                        className='text-xs text-gray-500 font-mono truncate max-w-[180px] cursor-pointer hover:text-orange-500'
                                        title={log.userId || 'anonymous'}
                                        onClick={() => log.userId && setFilter('userId', log.userId)}
                                    >
                                        {log.userId
                                            ? log.userId
                                            : <span className='text-gray-300 italic'>anonymous</span>
                                        }
                                    </span>
                                    {log.resourceId && (
                                        <span className='text-[10px] text-gray-300 font-mono truncate max-w-[120px]' title={log.resourceId}>
                                            {log.resourceId}
                                        </span>
                                    )}
                                    <span className='ml-auto text-[10px] text-gray-400 whitespace-nowrap'>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className='flex justify-center gap-2 py-4 border-t border-gray-100'>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className='text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50'
                            >← Prev</button>
                            <span className='text-xs text-gray-400 self-center'>Page {page} of {pages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(pages, p + 1))}
                                disabled={page === pages}
                                className='text-xs px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50'
                            >Next →</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
