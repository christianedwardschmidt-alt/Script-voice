'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, RefreshCw, Settings, ExternalLink, Puzzle } from 'lucide-react'

interface Integration {
  id: string
  name: string
  desc: string
  icon: string
  connected: boolean
  lastSync: string | null
  category: string
  color: string
}

const categories = ['All', 'Productivity', 'Design', 'Development', 'Finance']

export default function IntegrationsPage() {
  const [data, setData] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    fetch('/api/integrations')
      .then(res => res.json())
      .then(rows => { setData(rows); setLoading(false) })
  }, [])

  const toggle = async (id: string) => {
    const integ = data.find(i => i.id === id)
    if (!integ) return
    const connected = !integ.connected
    setData(prev => prev.map(i => i.id === id ? { ...i, connected, lastSync: connected ? 'just now' : null } : i))
    await fetch(`/api/integrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected }),
    })
  }

  const filtered = activeCategory === 'All' ? data : data.filter(i => i.category === activeCategory)
  const connectedCount = data.filter(i => i.connected).length

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Workspace</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>
            {connectedCount}/{data.length} integrations connected
          </p>
        </div>
        <button className="btn-primary"><Puzzle size={14} /> Add Integration</button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
              background: activeCategory === cat ? '#4347a8' : '#fff',
              color: activeCategory === cat ? '#fff' : '#6b7280',
              border: activeCategory === cat ? 'none' : '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading integrations...</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {!loading && filtered.map(integ => (
          <div key={integ.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {integ.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{integ.name}</div>
                  {integ.connected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: 11, color: '#10b981' }}>Connected · {integ.lastSync}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggle(integ.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: integ.connected ? '#f9fafb' : '#4347a8',
                  color: integ.connected ? '#6b7280' : '#fff',
                  border: integ.connected ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {integ.connected ? <><Check size={11} /> Connected</> : <><Plus size={11} /> Connect</>}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#78716c', marginBottom: integ.connected ? 10 : 0, lineHeight: 1.4 }}>{integ.desc}</p>
            {integ.connected && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', color: '#78716c', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <RefreshCw size={10} /> Sync
                </button>
                <button style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', color: '#78716c', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ExternalLink size={10} /> Open
                </button>
                <button style={{ width: 30, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', color: '#78716c', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={11} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
