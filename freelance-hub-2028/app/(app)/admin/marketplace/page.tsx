'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock } from 'lucide-react'

interface Submission {
  id: number
  name: string
  description: string
  category: string
  configuration: { icon?: string; trigger_type?: string; conditions?: unknown[]; actions?: unknown[] }
  submitted_by_profession: string
  created_at: string
}

export default function AdminMarketplacePage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState('')

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
    if (!isAdmin) return
    fetch('/api/admin/marketplace')
      .then(r => r.json())
      .then(data => { setSubmissions(Array.isArray(data) ? data : []); setLoading(false) })
  }, [isAdmin])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function approve(s: Submission) {
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/admin/marketplace/${s.id}/approve`, { method: 'POST' })
      if (res.ok) {
        setSubmissions(prev => prev.filter(x => x.id !== s.id))
        showToast(`"${s.name}" is now live in the marketplace`)
      }
    } finally {
      setBusyId(null)
    }
  }

  async function reject(s: Submission) {
    const reason = window.prompt(`Reason for rejecting "${s.name}"? (shown to the member, optional)`) ?? ''
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/admin/marketplace/${s.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setSubmissions(prev => prev.filter(x => x.id !== s.id))
        showToast(`"${s.name}" was rejected`)
      }
    } finally {
      setBusyId(null)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="page-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 60px' }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
        Marketplace Review Queue
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>
        {loading ? 'Loading…' : `${submissions.length} agent${submissions.length === 1 ? '' : 's'} awaiting review`}
      </p>

      {!loading && submissions.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          Nothing pending review right now.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {submissions.map(s => {
          const cfg = s.configuration || {}
          return (
            <div key={s.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827' }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 12, color: '#9CA3AF' }}>
                    <span>{s.category}</span>
                    <span>·</span>
                    <span>{s.submitted_by_profession || 'Independent Professional'}</span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => approve(s)}
                    disabled={busyId === s.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => reject(s)}
                    disabled={busyId === s.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#374151', margin: '0 0 12px', lineHeight: 1.5 }}>
                {s.description}
              </p>

              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, fontFamily: 'var(--font-body)', fontSize: 12, color: '#6B7280' }}>
                <div style={{ marginBottom: 4 }}><strong style={{ color: '#374151' }}>Icon:</strong> {cfg.icon || '—'}</div>
                <div style={{ marginBottom: 4 }}><strong style={{ color: '#374151' }}>Trigger:</strong> {cfg.trigger_type || '—'}</div>
                <div style={{ marginBottom: 4 }}><strong style={{ color: '#374151' }}>Conditions:</strong> {cfg.conditions?.length ? '' : 'None'}</div>
                <div style={{ marginBottom: cfg.actions?.length ? 4 : 0 }}><strong style={{ color: '#374151' }}>Actions:</strong> {cfg.actions?.length ? '' : 'None'}</div>
                {(!!cfg.conditions?.length || !!cfg.actions?.length) && (
                  <pre style={{ margin: '6px 0 0', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify({ conditions: cfg.conditions, actions: cfg.actions }, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff',
          padding: '10px 20px', borderRadius: 10, fontSize: 13, fontFamily: 'var(--font-body)', zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
