'use client'

import { Search, Filter, Briefcase, MapPin, Clock, DollarSign, Star, BookmarkPlus, Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Job {
  id: number
  title: string
  company: string
  location: string
  type: string
  budget: string
  posted: string
  tags: string[]
  description: string
  rating: number
  reviews: number
  saved: boolean
  applied: boolean
}

const typeColor: Record<string, string> = {
  Contract: '#dcfce7',
  Project: '#d1fae5',
  Retainer: '#fce7f3',
}
const typeText: Record<string, string> = {
  Contract: 'var(--accent-brand)',
  Project: '#059669',
  Retainer: '#db2777',
}

export default function JobsPage() {
  const [data, setData] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(rows => { setData(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  const filtered = data.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSave = async (id: number) => {
    const job = data.find(j => j.id === id)
    if (!job) return
    const saved = !job.saved
    setData(prev => prev.map(j => j.id === id ? { ...j, saved } : j))
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved }),
    })
  }

  const apply = async (id: number) => {
    setData(prev => prev.map(j => j.id === id ? { ...j, applied: true } : j))
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applied: true }),
    })
  }

  return (
    <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Browse Jobs</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 14, marginTop: 2 }}>Discover top freelance opportunities</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
          <input className="search-input" placeholder="Search jobs, companies, skills..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-outline"><Filter size={14} /> Filter</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading jobs...</div>}
        {!loading && filtered.map(job => (
          <div key={job.id} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} color="var(--accent-brand)" />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: '#111827' }}>{job.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', marginTop: 2 }}>{job.company}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => toggleSave(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: job.saved ? '#f59e0b' : '#9ca3af' }}>
                  <BookmarkPlus size={18} fill={job.saved ? '#f59e0b' : 'none'} />
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: '7px 16px', fontSize: 13, opacity: job.applied ? 0.6 : 1, cursor: job.applied ? 'default' : 'pointer' }}
                  onClick={() => !job.applied && apply(job.id)}
                  disabled={job.applied}
                >
                  {job.applied ? <><Check size={13} /> Applied</> : 'Apply'}
                </button>
              </div>
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 12 }}>{job.description}</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {job.tags.map(tag => (
                <span key={tag} className="badge badge-inprogress">{tag}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#78716c' }}>
                <DollarSign size={12} /> {job.budget}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#78716c' }}>
                <MapPin size={12} /> {job.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#78716c' }}>
                <Clock size={12} /> {job.posted}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f59e0b' }}>
                <Star size={12} fill="#f59e0b" /> {job.rating} ({job.reviews})
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: typeColor[job.type], color: typeText[job.type] }}>
                {job.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
