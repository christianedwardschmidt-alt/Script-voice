'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download } from 'lucide-react'

interface SignupRow {
  id: number
  name: string
  email: string
  created_at: string
}

const card = { background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }

function csvEscape(value: string): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<SignupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

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
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false) })
  }, [isAdmin])

  const stats = useMemo(() => {
    const now = Date.now()
    const week = 7 * 86400000
    const month = 30 * 86400000
    return {
      total: users.length,
      thisWeek: users.filter(u => now - new Date(u.created_at).getTime() <= week).length,
      thisMonth: users.filter(u => now - new Date(u.created_at).getTime() <= month).length,
    }
  }, [users])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, query])

  function exportCsv() {
    const header = ['ID', 'Name', 'Email', 'Signed Up (UTC)']
    const rows = filtered.map(u => [csvEscape(String(u.id)), csvEscape(u.name), csvEscape(u.email), csvEscape(u.created_at)])
    const csv = [header, ...rows].map(r => r.join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guildwire-signups-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isAdmin) return null

  return (
    <div className="page-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            Signups
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', margin: 0 }}>
            {loading ? 'Loading…' : `${stats.total} member${stats.total === 1 ? '' : 's'} on GuildWire`}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={loading || filtered.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9,
            border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
            cursor: loading || filtered.length === 0 ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
            opacity: loading || filtered.length === 0 ? 0.5 : 1,
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total signups', value: stats.total },
            { label: 'New this week', value: stats.thisWeek },
            { label: 'New this month', value: stats.thisMonth },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 700, color: '#111827' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email"
          style={{
            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid #E5E7EB',
            fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', background: '#fff',
          }}
        />
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 140px', padding: '10px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Name</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Email</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Signed up</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            {users.length === 0 ? 'No signups yet.' : 'No members match your search.'}
          </div>
        ) : (
          filtered.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1.3fr 140px', padding: '13px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid #F9FAFB' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  fontFamily: 'var(--font-body)', flexShrink: 0,
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              </div>
              <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
              <div>
                <div style={{ fontSize: 12.5, color: '#374151', fontFamily: 'var(--font-body)' }}>
                  {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{timeAgo(u.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
