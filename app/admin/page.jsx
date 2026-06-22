'use client'
import { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'

export default function AdminPage() {
    const { router } = useAppContext()
    useEffect(() => { router.replace('/admin/dashboard') }, [])
    return null
}
