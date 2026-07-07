'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/demo', { method: 'POST' })
      .then(res => {
        if (res.ok) {
          router.push('/dashboard')
          router.refresh()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f2f4f8', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #007a3a, #00b857)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>GW</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(13,16,23,0.45)' }}>Loading demo…</div>
      </div>
    </div>
  )
}
