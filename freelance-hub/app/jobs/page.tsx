'use client'

import { Search, Filter, Briefcase, MapPin, Clock, DollarSign, Star, BookmarkPlus } from 'lucide-react'
import { useState } from 'react'

const jobs = [
  {
    id: 1, title: 'Senior UI/UX Designer', company: 'Stripe', location: 'Remote', type: 'Contract',
    budget: '$120–160/hr', posted: '2h ago', tags: ['Figma', 'Design Systems', 'React'],
    description: 'Looking for an experienced designer to lead our dashboard redesign. 3-month engagement.',
    rating: 4.9, reviews: 24, saved: false,
  },
  {
    id: 2, title: 'Full Stack Next.js Developer', company: 'Vercel', location: 'Remote', type: 'Project',
    budget: '$18,000 fixed', posted: '5h ago', tags: ['Next.js', 'TypeScript', 'PostgreSQL'],
    description: 'Build a SaaS analytics platform from scratch. Solo project, 2 months timeline.',
    rating: 4.7, reviews: 18, saved: true,
  },
  {
    id: 3, title: 'Brand Identity Designer', company: 'Linear', location: 'Hybrid', type: 'Contract',
    budget: '$90–110/hr', posted: '1d ago', tags: ['Branding', 'Illustration', 'Motion'],
    description: 'Refreshing our brand identity. Need a creative who understands B2B SaaS.',
    rating: 4.8, reviews: 31, saved: false,
  },
  {
    id: 4, title: 'React Native Developer', company: 'Notion', location: 'Remote', type: 'Retainer',
    budget: '$8,500/mo', posted: '2d ago', tags: ['React Native', 'iOS', 'Android'],
    description: 'Ongoing mobile app development. 20 hrs/week retainer arrangement.',
    rating: 5.0, reviews: 12, saved: false,
  },
]

const typeColor: Record<string, string> = {
  Contract: '#ede9fe',
  Project: '#d1fae5',
  Retainer: '#fce7f3',
}
const typeText: Record<string, string> = {
  Contract: '#7c3aed',
  Project: '#059669',
  Retainer: '#db2777',
}

export default function JobsPage() {
  const [data, setData] = useState(jobs)
  const [search, setSearch] = useState('')

  const filtered = data.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSave = (id: number) => {
    setData(prev => prev.map(j => j.id === id ? { ...j, saved: !j.saved } : j))
  }

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Browse Jobs</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Discover top freelance opportunities</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
          <input className="search-input" placeholder="Search jobs, companies, skills..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-outline"><Filter size={14} /> Filter</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(job => (
          <div key={job.id} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1917' }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: '#78716c', marginTop: 2 }}>{job.company}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => toggleSave(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: job.saved ? '#f59e0b' : '#9ca3af' }}>
                  <BookmarkPlus size={18} fill={job.saved ? '#f59e0b' : 'none'} />
                </button>
                <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Apply</button>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5, marginBottom: 12 }}>{job.description}</p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {job.tags.map(tag => (
                <span key={tag} className="badge badge-purple">{tag}</span>
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
