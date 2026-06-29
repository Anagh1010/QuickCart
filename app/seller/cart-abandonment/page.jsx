'use client'
import React, { useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import Footer from '@/components/seller/Footer'

const getRatingColor = (rate) => {
    if (rate >= 70) return 'bg-red-500'
    if (rate >= 40) return 'bg-orange-400'
    return 'bg-green-500'
}

const getRatingLabel = (rate) => {
    if (rate >= 70) return { text: 'High Risk', cls: 'bg-red-50 text-red-600 border border-red-200' }
    if (rate >= 40) return { text: 'Medium Risk', cls: 'bg-orange-50 text-orange-600 border border-orange-200' }
    return { text: 'Low Risk', cls: 'bg-green-50 text-green-600 border border-green-200' }
}

// Default: last 30 days
const today = new Date()
const defaultTo = today.toISOString().split('T')[0]
const defaultFrom = new Date(today - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export default function CartAbandonmentPage() {
    const { getToken, currency } = useAppContext()
    const [from, setFrom] = useState(defaultFrom)
    const [to, setTo] = useState(defaultTo)
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)

    const analyse = async () => {
        if (!from || !to) return toast.error('Please select both dates')
        if (new Date(from) > new Date(to)) return toast.error('Start date must be before end date')
        setLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.get(`/api/seller/cart-abandonment?from=${from}&to=${to}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success) {
                setResults(data.results)
                if (data.results.length === 0) toast('No products found', { icon: 'ℹ️' })
            } else {
                toast.error(data.message)
            }
        } catch {
            toast.error('Failed to load analysis')
        } finally {
            setLoading(false)
        }
    }

    const totalAbandoned = results?.reduce((s, r) => s + r.abandonedCount, 0) ?? 0
    const totalInCart = results?.reduce((s, r) => s + r.inCartCount, 0) ?? 0
    const avgRate = totalInCart > 0 ? Math.round((totalAbandoned / totalInCart) * 100) : 0

    return (
        <div className='flex-1 min-h-screen flex flex-col justify-between bg-gray-50 text-gray-800'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                {/* Header */}
                <div>
                    <h2 className='text-2xl font-semibold text-gray-950'>Cart Abandonment Analysis</h2>
                    <p className='text-xs text-gray-500 font-medium mt-1'>
                        See which of your products users have in their cart but haven't ordered in the selected period.
                    </p>
                </div>

                {/* Date Picker */}
                <div className='bg-white rounded-2xl border border-gray-200 shadow-xs p-6'>
                    <h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-4'>Select Date Range</h3>
                    <div className='flex flex-wrap items-end gap-4'>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-xs font-bold text-gray-400 uppercase tracking-wider'>From</label>
                            <input
                                type='date'
                                value={from}
                                max={to}
                                onChange={e => setFrom(e.target.value)}
                                className='border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-orange-400 bg-white'
                            />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-xs font-bold text-gray-400 uppercase tracking-wider'>To</label>
                            <input
                                type='date'
                                value={to}
                                min={from}
                                max={defaultTo}
                                onChange={e => setTo(e.target.value)}
                                className='border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-orange-400 bg-white'
                            />
                        </div>
                        <button
                            onClick={analyse}
                            disabled={loading}
                            className='bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60'
                        >
                            {loading ? 'Analysing...' : 'Analyse'}
                        </button>
                    </div>
                </div>

                {/* Summary Cards — shown after first fetch */}
                {results !== null && (
                    <>
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                            <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-xs'>
                                <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>In Cart (currently)</span>
                                <div className='flex items-baseline gap-1.5 mt-3'>
                                    <span className='text-3xl font-extrabold text-gray-950'>{totalInCart}</span>
                                    <span className='text-xs text-gray-400 font-medium'>users</span>
                                </div>
                            </div>
                            <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-xs'>
                                <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Abandoned in Period</span>
                                <div className='flex items-baseline gap-1.5 mt-3'>
                                    <span className='text-3xl font-extrabold text-orange-600'>{totalAbandoned}</span>
                                    <span className='text-xs text-gray-400 font-medium'>users</span>
                                </div>
                            </div>
                            <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-xs'>
                                <span className='text-xs font-bold text-gray-400 uppercase tracking-wider'>Avg Abandonment Rate</span>
                                <div className='flex items-baseline gap-1.5 mt-3'>
                                    <span className={`text-3xl font-extrabold ${avgRate >= 70 ? 'text-red-500' : avgRate >= 40 ? 'text-orange-500' : 'text-green-600'}`}>
                                        {avgRate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Per-Product Table */}
                        {results.length === 0 ? (
                            <div className='bg-white rounded-2xl border border-gray-200 shadow-xs p-12 text-center text-gray-400'>
                                <p className='text-3xl mb-2'>🛒</p>
                                <p>None of your products are currently in any user's cart.</p>
                            </div>
                        ) : (
                            <div className='bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden'>
                                <div className='px-6 py-4 border-b border-gray-100'>
                                    <h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider'>Product-wise Breakdown</h3>
                                </div>
                                <div className='divide-y divide-gray-100'>
                                    {results.map(r => {
                                        const risk = getRatingLabel(r.abandonmentRate)
                                        return (
                                            <div key={r.productId} className='px-6 py-5 hover:bg-gray-50 transition-colors'>
                                                <div className='flex items-center gap-4 mb-3'>
                                                    <img
                                                        src={r.image}
                                                        alt={r.name}
                                                        className='w-12 h-12 rounded-xl object-cover border border-gray-100'
                                                        onError={e => e.target.style.display = 'none'}
                                                    />
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex items-center gap-2 flex-wrap'>
                                                            <p className='text-gray-900 font-semibold truncate'>{r.name}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${risk.cls}`}>
                                                                {risk.text}
                                                            </span>
                                                        </div>
                                                        <p className='text-gray-400 text-xs mt-0.5'>{currency}{r.price?.toLocaleString()}</p>
                                                    </div>
                                                    <div className='hidden sm:flex items-center gap-6 text-center'>
                                                        <div>
                                                            <p className='text-lg font-extrabold text-gray-950'>{r.inCartCount}</p>
                                                            <p className='text-xs text-gray-400 uppercase tracking-wider font-bold'>In Cart</p>
                                                        </div>
                                                        <div>
                                                            <p className='text-lg font-extrabold text-green-600'>{r.orderedCount}</p>
                                                            <p className='text-xs text-gray-400 uppercase tracking-wider font-bold'>Ordered</p>
                                                        </div>
                                                        <div>
                                                            <p className='text-lg font-extrabold text-orange-600'>{r.abandonedCount}</p>
                                                            <p className='text-xs text-gray-400 uppercase tracking-wider font-bold'>Abandoned</p>
                                                        </div>
                                                        <div>
                                                            <p className={`text-lg font-extrabold ${r.abandonmentRate >= 70 ? 'text-red-500' : r.abandonmentRate >= 40 ? 'text-orange-500' : 'text-green-600'}`}>
                                                                {r.abandonmentRate}%
                                                            </p>
                                                            <p className='text-xs text-gray-400 uppercase tracking-wider font-bold'>Rate</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Abandonment rate bar */}
                                                <div className='w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200/50'>
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${getRatingColor(r.abandonmentRate)}`}
                                                        style={{ width: `${r.abandonmentRate}%` }}
                                                    />
                                                </div>
                                                {/* Mobile stats */}
                                                <div className='sm:hidden flex items-center gap-4 mt-3 text-center'>
                                                    <div><p className='text-base font-extrabold text-gray-950'>{r.inCartCount}</p><p className='text-xs text-gray-400'>In Cart</p></div>
                                                    <div><p className='text-base font-extrabold text-green-600'>{r.orderedCount}</p><p className='text-xs text-gray-400'>Ordered</p></div>
                                                    <div><p className='text-base font-extrabold text-orange-600'>{r.abandonedCount}</p><p className='text-xs text-gray-400'>Abandoned</p></div>
                                                    <div><p className={`text-base font-extrabold ${r.abandonmentRate >= 70 ? 'text-red-500' : 'text-orange-500'}`}>{r.abandonmentRate}%</p><p className='text-xs text-gray-400'>Rate</p></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    )
}
