'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrandPreview, setBrandPreview, VERUNO_DEMO_EMAIL } from '@/lib/brandPreview'

export default function AdminSandboxPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRealAdmin, setIsRealAdmin] = useState(false)
  const [previewOn, setPreviewOn] = useState(false)
  const [reseedState, setReseedState] = useState<'idle' | 'loading' | 'done' | 'skipped' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(profile => {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'christianedwardschmidt@gmail.com'
        // The Veruno demo account can reach this page too — only to flip
        // the same toggle it already defaults to on, e.g. for an in-demo
        // before/after comparison — not a grant of admin privileges
        // (marketplace review, user admin, etc. stay gated to adminEmail
        // alone via the separate isAdmin() check those routes use, which
        // is also what the reseed button below calls — so it's kept
        // hidden from the demo account itself rather than shown and
        // failing with 401).
        if (profile?.email === adminEmail) {
          setIsAdmin(true)
          setIsRealAdmin(true)
        } else if (profile?.email === VERUNO_DEMO_EMAIL) {
          setIsAdmin(true)
        } else {
          router.replace('/dashboard')
        }
      })
      .catch(() => router.replace('/dashboard'))
  }, [router])

  async function reseedDemo() {
    setReseedState('loading')
    try {
      const res = await fetch('/api/admin/reseed-demo', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setReseedState(data.skipped ? 'skipped' : 'done')
    } catch {
      setReseedState('error')
    }
  }

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
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
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
          style={{ width: 44, height: 24, borderRadius: 12, background: previewOn ? 'var(--accent-brand)' : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0, marginLeft: 16 }}
        >
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', position: 'absolute', top: 3, left: previewOn ? 23 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
        </div>
      </div>

      {isRealAdmin && (
        <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 560, marginTop: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Backfill Veruno demo account
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Adds sample agents, notes, and proposals to demo@veruno.io — it signed up before those were part of
              the seed. Safe to click once; running it again after the first success is a no-op.
            </div>
          </div>
          <button
            onClick={reseedDemo}
            disabled={reseedState === 'loading'}
            style={{
              flexShrink: 0, marginLeft: 16, padding: '8px 14px', borderRadius: 8, border: 'none',
              background: reseedState === 'done' ? '#16A34A' : reseedState === 'error' ? '#DC2626' : 'var(--accent-brand)',
              color: 'white', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: reseedState === 'loading' ? 'default' : 'pointer', opacity: reseedState === 'loading' ? 0.7 : 1,
            }}
          >
            {reseedState === 'loading' ? 'Working…'
              : reseedState === 'done' ? 'Done ✓'
              : reseedState === 'skipped' ? 'Already seeded'
              : reseedState === 'error' ? 'Failed — retry?'
              : 'Run backfill'}
          </button>
        </div>
      )}
    </div>
  )
}
