'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SessionUser {
  id: string
  username: string
  name: string | null
}

interface AuthData {
  user: SessionUser | null
}

export function useAuth() {
  const router = useRouter()
  const [data, setData] = useState<{ session: SessionUser | null } | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data: AuthData = await response.json()
      
      if (data.user) {
        setData({ session: data.user })
        setStatus('authenticated')
      } else {
        setData({ session: null })
        setStatus('unauthenticated')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch session:', error)
      setData({ session: null })
      setStatus('unauthenticated')
      router.push('/auth/signin')
    }
  }

  return {
    data,
    status,
    refetch: fetchSession,
  }
}
