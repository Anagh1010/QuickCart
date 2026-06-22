'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const levelStyles = {
    error: 'bg-red-50 text-red-600 border border-red-200',
    warn: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    info: 'bg-blue-50 text-blue-600 border border-blue-200'
}

const LevelBadge = ({ level }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${levelStyles[level] || levelStyles.info}`}>
        {level?.toUpperCase()}
    </span>
)

export default function AdminLogsPage() {
    const { getToken } = useAppContext()
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [filters, setFilters] = useState({ level: 'all', route: '', page: 1 })

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const params = new URLSearchParams({
                page: filters.page,
                limit: 50,
                ...(filters.level !== 'all' && { level: filters.level }),
                ...(filters.route && { route: filters.route })
            })
            const { data } = await axios.get(`/api/admin/logs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
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

    const handleClearOld = async (days) => {
        if (!confirm(`Delete all logs older than ${days} days?`)) return
        setDeleting(true)
        try {
            const token = await getToken()
            const { data } = await axios.delete(`/api/admin/logs?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
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

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-950'>Error Logs</h2>
                        <p className='text-xs text-gray-500 font-medium mt-1'>{total} total log entries · auto-purged after 90 days</p>
                    </div>
                    <button
                        onClick={() => handleClearOld(30)}
                        disabled={deleting}
                        className='text-xs text-red-500 border border-red-200 bg-white px-4 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50'
                    >
                        {deleting ? 'Clearing...' : 'Clear logs older than 30 days'}
                    </button>
                </div>

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
                    <input
                        type='text'
                        placeholder='Filter by route...'
                        value={filters.route}
                        onChange={e => setFilters(f => ({ ...f, route: e.target.value, page: 1 }))}
                        className='border border-gray-200 bg-white text-gray-700 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 w-64'
                    />
                    <button
                        onClick={fetchLogs}
                        className='px-4 py-2.5 bg-white border border-gray-200 hover:border-orange-400 text-gray-600 rounded-xl text-sm transition-colors'
                    >
                        Refresh
                    </button>
                </div>

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
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-gray-800 text-sm font-medium truncate'>{log.message}</p>
                                            <div className='flex flex-wrap gap-3 mt-1 text-xs text-gray-400'>
                                                {log.route && <span>📍 {log.route}</span>}
                                                {log.userId && <span>👤 {log.userId.slice(0, 20)}...</span>}
                                                <span>🕒 {new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className='text-gray-400 text-xs mt-1'>{expanded === log._id ? '▲' : '▼'}</span>
                                    </div>
                                    {expanded === log._id && log.stack && (
                                        <pre className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-red-500 font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto'>
                                            {log.stack}
                                        </pre>
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
