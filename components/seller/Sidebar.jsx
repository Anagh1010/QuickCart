'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    {
        name: 'Dashboard',
        path: '/seller/dashboard',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
            </svg>
        )
    },
    {
        name: 'Add Product',
        path: '/seller',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
            </svg>
        )
    },
    {
        name: 'Product List',
        path: '/seller/product-list',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 10h16M4 14h16M4 18h16' />
            </svg>
        )
    },
    {
        name: 'Manage Stock',
        path: '/seller/inventory',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
            </svg>
        )
    },
    {
        name: 'Coupons',
        path: '/seller/coupons',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M7 7h.01M17 17h.01M3 12a9 9 0 1118 0 9 9 0 01-18 0zm7.5-4.5l6 9' />
            </svg>
        )
    },
    {
        name: 'Orders',
        path: '/seller/orders',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' />
            </svg>
        )
    },
    {
        name: 'Cart Analysis',
        path: '/seller/cart-abandonment',
        icon: (
            <svg className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth={1.8} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
            </svg>
        )
    },
];

const SideBar = () => {
    const pathname = usePathname();

    return (
        <div className='md:w-64 w-16 border-r border-gray-300 min-h-screen text-base py-2 flex flex-col'>
            {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div className={`flex items-center py-3 px-4 gap-3 ${
                            isActive
                                ? 'border-r-4 md:border-r-[6px] bg-blue-600/10 border-blue-500/90 text-blue-600'
                                : 'hover:bg-gray-100/90 border-white text-gray-700'
                        }`}>
                            {item.icon}
                            <p className='md:block hidden font-medium'>{item.name}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default SideBar;
