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
      <span className='text-xs font-semibold text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1 rounded-full'>
          ADMIN
        </span>
    </div>
  )
}

export default Navbar
