'use client'
import { useAppContext } from '@/context/AppContext'
import { useEffect } from 'react'
import AdminNavbar from '@/components/admin/Navbar'
import AdminSidebar from '@/components/admin/Sidebar'

export default function AdminLayout({ children }) {
    const { isAdmin, router, user } = useAppContext()

    useEffect(() => {
        if (user !== undefined && !isAdmin) {
            router.push('/')
        }
    }, [user, isAdmin])

    if (!isAdmin) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gray-50'>
                <div className='text-gray-400 text-sm'>Checking permissions...</div>
            </div>
        )
    }

    return (
        <div>
            <AdminNavbar />
            <div className='flex w-full'>
                <AdminSidebar />
                <main className='flex-1 overflow-auto'>
                    {children}
                </main>
            </div>
        </div>
    )
}
