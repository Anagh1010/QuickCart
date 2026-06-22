'use client'
import React, { useEffect, useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const ROLES = ['user', 'seller', 'admin']

const roleColors = {
    admin: 'bg-red-50 text-red-600 border border-red-200',
    seller: 'bg-orange-50 text-orange-600 border border-orange-200',
    user: 'bg-gray-100 text-gray-600 border border-gray-200'
}

export default function AdminUsersPage() {
    const { getToken } = useAppContext()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState(null)

    const fetchUsers = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
            if (data.success) setUsers(data.users)
        } catch {
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId)
        try {
            const token = await getToken()
            const { data } = await axios.patch(
                `/api/admin/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch {
            toast.error('Failed to update role')
        } finally {
            setUpdating(null)
        }
    }

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className='flex-1 min-h-screen bg-gray-50'>
            <div className='w-full md:p-10 p-4 max-w-5xl mx-auto space-y-8'>

                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <h2 className='text-2xl font-semibold text-gray-950'>All Users</h2>
                        <p className='text-xs text-gray-500 font-medium mt-1'>{users.length} registered accounts</p>
                    </div>
                    <input
                        type='text'
                        placeholder='Search by name or email...'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className='border border-gray-200 bg-white text-gray-700 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 w-full sm:w-72'
                    />
                </div>

                <div className='bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden'>
                    {loading ? (
                        <div className='flex items-center justify-center h-64'>
                            <div className='animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full' />
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider'>
                                        <th className='text-left px-6 py-4 font-bold'>User</th>
                                        <th className='text-left px-6 py-4 font-bold'>Email</th>
                                        <th className='text-left px-6 py-4 font-bold'>Role</th>
                                        <th className='text-left px-6 py-4 font-bold'>Change Role</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className='text-center py-12 text-gray-400'>No users found</td>
                                        </tr>
                                    ) : filtered.map(user => (
                                        <tr key={user._id} className='hover:bg-gray-50 transition-colors'>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-3'>
                                                    {user.imageUrl ? (
                                                        <img
                                                            src={user.imageUrl}
                                                            alt={user.name}
                                                            className='w-8 h-8 rounded-full object-cover'
                                                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        style={{ display: user.imageUrl ? 'none' : 'flex' }}
                                                        className='w-8 h-8 rounded-full bg-orange-100 items-center justify-center text-orange-600 font-semibold text-xs'
                                                    >
                                                        {user.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className='text-gray-800 font-medium'>{user.name}</span>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 text-gray-500'>{user.email}</td>
                                            <td className='px-6 py-4'>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || roleColors.user}`}>
                                                    {user.role || 'user'}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center gap-2'>
                                                    {ROLES.map(role => (
                                                        <button
                                                            key={role}
                                                            disabled={user.role === role || updating === user._id}
                                                            onClick={() => handleRoleChange(user._id, role)}
                                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                                                                user.role === role
                                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                    : 'bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-gray-600 border-gray-200 cursor-pointer'
                                                            } ${updating === user._id ? 'opacity-50' : ''}`}
                                                        >
                                                            {updating === user._id ? '...' : role}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
