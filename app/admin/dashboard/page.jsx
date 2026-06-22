'use client'
import React, { useEffect, useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import Link from 'next/link'

const StatCard = ({ label, value, sub }) => (
    <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between'>
        <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>{label}</span>
        <div className='flex items-baseline gap-1.5 mt-3'>
            <span className='text-3xl font-extrabold text-gray-950'>{value ?? '—'}</span>
            {sub && <span className='text-xs text-gray-400 font-medium'>{sub}</span>}
        </div>
    </div>
)

const LevelBadge = ({ level }) => {
    const styles = {
        error: 'bg-red-50 text-red-600 border border-red-200',
        warn: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        info: 'bg-blue-50 text-blue-600 border border-blue-200'
    }
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[level] || styles.info}`}>
            {level?.toUpperCase()}
        </span>
    )
}

export default function AdminDashboard() {
    const { getToken, currency } = useAppContext()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
                if (data.success) setStats(data.stats)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (loading) {
        return (
            <div className='flex items-center justify-center h-96'>
                <div className='animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full' />
            </div>
        )
    }

    const cur = currency || '₹'

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers, sub: 'Registered accounts' },
        { label: 'Active Sellers', value: stats?.totalSellers, sub: 'Sellers & admins' },
        { label: 'Total Orders', value: stats?.totalOrders, sub: 'Transactions' },
        { label: 'Total Products', value: stats?.totalProducts, sub: 'Active listings' },
        { label: 'Total Revenue', value: stats?.totalRevenue ? `${cur}${stats.totalRevenue.toLocaleString()}` : `${cur}0`, sub: 'Paid & confirmed' },
    ]

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                <div>
                    <h2 className='text-2xl font-semibold text-gray-950'>Admin Dashboard</h2>
                    <p className='text-xs text-gray-500 font-medium mt-1'>Platform-wide overview — users, sellers, orders, revenue, and recent errors.</p>
                </div>

                {/* Stats Grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {statCards.map(c => <StatCard key={c.label} {...c} />)}
                </div>

                {/* Recent Errors */}
                <div className='bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden'>
                    <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
                        <h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider'>Recent Errors</h3>
                        <Link href='/admin/logs' className='text-orange-600 text-sm hover:underline font-medium'>View all →</Link>
                    </div>
                    {stats?.recentErrors?.length > 0 ? (
                        <div className='divide-y divide-gray-100'>
                            {stats.recentErrors.map((log) => (
                                <div key={log._id} className='px-6 py-4 flex items-start gap-4'>
                                    <LevelBadge level={log.level} />
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-gray-800 text-sm font-medium truncate'>{log.message}</p>
                                        <p className='text-gray-400 text-xs mt-0.5'>{log.route} · {new Date(log.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='px-6 py-10 text-center text-gray-400 text-sm'>
                            🎉 No recent errors — everything looks healthy!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
