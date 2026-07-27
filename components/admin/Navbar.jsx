'use client'
import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image'
import { useAppContext } from '@/context/AppContext'

const Navbar = () => {
  const { router } = useAppContext()

  return (
    <div className='flex items-center px-4 md:px-8 py-3 justify-between border-b border-gray-300'>
      <Image
        onClick={() => router.push('/')}
        className='w-28 lg:w-32 h-auto cursor-pointer'
        src={assets.logo}
        alt='QuickCart'
      />
      <div className='flex items-center gap-3'>
        <button
          onClick={() => router.push('/')}
          className='text-xs text-gray-500 hover:text-blue-600 transition hidden sm:block'
        >
          ← Storefront
        </button>
        <span className='text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full'>
          ADMIN
        </span>
      </div>
    </div>
  )
}

export default Navbar
