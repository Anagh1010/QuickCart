'use client'
import React, { useEffect, useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AdminSellersPage() {
    const { getToken } = useAppContext()
    const [sellers, setSellers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetch = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/admin/sellers', { headers: { Authorization: `Bearer ${token}` } })
                if (data.success) setSellers(data.sellers)
            } catch {
                toast.error('Failed to load sellers')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const filtered = sellers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-950'>Sellers</h2>
                        <p className='text-xs text-gray-500 font-medium mt-1'>{sellers.length} active sellers on the platform</p>
                    </div>
                    <input
                        type='text'
                        placeholder='Search sellers...'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className='border border-gray-200 bg-white text-gray-700 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 w-full sm:w-72'
                    />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {loading ? (
                        <div className='col-span-3 flex items-center justify-center h-64'>
                            <div className='animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full' />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className='col-span-3 text-center py-16 text-gray-400'>No sellers found</div>
                    ) : filtered.map(seller => (
                        <div key={seller._id} className='bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-orange-300 transition-colors'>
                            <div className='flex items-center gap-3 mb-4'>
                                {seller.imageUrl ? (
                                    <img
                                        src={seller.imageUrl}
                                        alt={seller.name}
                                        className='w-12 h-12 rounded-full object-cover ring-2 ring-orange-100'
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                                    />
                                ) : null}
                                <div
                                    style={{ display: seller.imageUrl ? 'none' : 'flex' }}
                                    className='w-12 h-12 rounded-full bg-orange-50 items-center justify-center text-orange-500 font-bold text-lg'
                                >
                                    {seller.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className='text-gray-900 font-semibold'>{seller.name}</p>
                                    <p className='text-gray-400 text-xs'>{seller.email}</p>
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-3 mb-3'>
                                <div className='bg-gray-50 rounded-xl p-3 text-center border border-gray-100'>
                                    <p className='text-2xl font-extrabold text-orange-600'>{seller.productCount}</p>
                                    <p className='text-gray-400 text-xs mt-0.5 uppercase tracking-wider font-bold'>Products</p>
                                </div>
                                <div className='bg-gray-50 rounded-xl p-3 text-center border border-gray-100'>
                                    <p className='text-2xl font-extrabold text-gray-950'>{seller.orderCount}</p>
                                    <p className='text-gray-400 text-xs mt-0.5 uppercase tracking-wider font-bold'>Orders</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                                seller.role === 'admin'
                                    ? 'bg-red-50 text-red-600 border-red-200'
                                    : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${seller.role === 'admin' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                {seller.role === 'admin' ? 'Admin & Seller' : 'Active Seller'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
