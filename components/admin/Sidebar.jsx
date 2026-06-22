'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
    {
        name: 'Dashboard',
        path: '/admin/dashboard',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
            </svg>
        )
    },
    {
        name: 'Users',
        path: '/admin/users',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
        )
    },
    {
        name: 'Sellers',
        path: '/admin/sellers',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
        )
    },
    {
        name: 'Error Logs',
        path: '/admin/logs',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
        )
    },
]

const Sidebar = () => {
    const pathname = usePathname()

    return (
        <div className='md:w-64 w-16 border-r border-gray-300 min-h-screen text-base py-2 flex flex-col'>
            {menuItems.map((item) => {
                const isActive = pathname === item.path
                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div className={`flex items-center py-3 px-4 gap-3 ${
                            isActive
                                ? 'border-r-4 md:border-r-[6px] bg-orange-600/10 border-orange-500/90 text-orange-600'
                                : 'hover:bg-gray-100/90 border-white text-gray-700'
                        }`}>
                            {item.icon}
                            <p className='md:block hidden'>{item.name}</p>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}

export default Sidebar
