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

      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)',
        padding: '20px 24px', color: '#374151', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5,
      }}>
        Look at the top-left corner — the real sidebar logo reads <strong>Veruno</strong> while you're on this
        page, sized to nearly fill the sidebar width. It reverts to GuildWire everywhere else.
      </div>
    </div>
  )
}
