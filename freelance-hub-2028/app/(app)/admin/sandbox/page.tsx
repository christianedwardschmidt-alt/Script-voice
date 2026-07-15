'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrandPreview, setBrandPreview } from '@/lib/brandPreview'

export default function AdminSandboxPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [previewOn, setPreviewOn] = useState(false)

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

  useEffect(() => {
    setPreviewOn(getBrandPreview())
  }, [])

  function toggle() {
    const next = !previewOn
    setBrandPreview(next)
    setPreviewOn(next)
  }

  if (!isAdmin) return null

  return (
    <div className="page-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 60px' }}>
      <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
        Sandbox
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
        Private admin-only page, not linked anywhere. Reachable only at /admin/sandbox. Safe place to try things
        without touching the rest of the app.
      </p>

      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 560 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>
            Preview Veruno branding
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            Swaps the sidebar logo everywhere you navigate — Dashboard, AI Agents, all of it. Only visible in
            this browser, only for you. Flip it off to go back to GuildWire.
          </div>
        </div>
        <div
          onClick={toggle}
          style={{ width: 44, height: 24, borderRadius: 12, background: previewOn ? '#16a34a' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0, marginLeft: 16 }}
        >
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', position: 'absolute', top: 3, left: previewOn ? 23 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>
      </div>
    </div>
  )
}
