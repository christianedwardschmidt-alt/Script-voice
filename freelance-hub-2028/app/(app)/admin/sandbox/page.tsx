'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSandboxPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(profile => {
        if (profile?.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'christianedwardschmidt@gmail.com')) {
          setIsAdmin(true)
        } else {
          router.replace('/dashboard')
        }
      })
      .catch(() => router.replace('/dashboard'))
  }, [router])

  if (!isAdmin) return null

  return (
    <div className="page-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 60px' }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
        Sandbox
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
        Private admin-only page, not linked anywhere. Reachable only at /admin/sandbox. Safe place to try things
        without touching the rest of the app.
      </p>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9CA3AF', margin: '0 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Mock sidebar — Veruno wordmark
      </p>
      <div style={{ width: 240, border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <span
            id="veruno-logo"
            style={{
              fontFamily: 'var(--font-body)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
              fontSize: 53, color: '#111827', whiteSpace: 'nowrap', display: 'block',
            }}
          >
            Veruno
          </span>
        </div>
      </div>
    </div>
  )
}
