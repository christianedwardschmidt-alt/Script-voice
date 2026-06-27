'use client'

import { useState } from 'react'
import { Check, Plus, RefreshCw, Settings, ExternalLink, Puzzle } from 'lucide-react'

const integrations = [
  { id: 'ms365', name: 'Microsoft 365', desc: 'Word, Excel, PowerPoint, Outlook & Teams', icon: '🪟', connected: true, lastSync: '2 min ago', category: 'Productivity', color: '#0078d4' },
  { id: 'notion', name: 'Notion', desc: 'All-in-one workspace for notes and docs', icon: '◼', connected: true, lastSync: '5 min ago', category: 'Productivity', color: '#1a1535' },
  { id: 'slack', name: 'Slack', desc: 'Team communication and collaboration', icon: '💬', connected: true, lastSync: '1 min ago', category: 'Productivity', color: '#4a154b' },
  { id: 'figma', name: 'Figma', desc: 'Collaborative design and prototyping', icon: '🎨', connected: true, lastSync: '10 min ago', category: 'Design', color: '#f24e1e' },
  { id: 'adobe', name: 'Adobe Creative Cloud', desc: 'Photoshop, Illustrator, XD & more', icon: '🔴', connected: false, lastSync: null, category: 'Design', color: '#ff0000' },
  { id: 'github', name: 'GitHub', desc: 'Version control and code collaboration', icon: '🐙', connected: true, lastSync: '3 min ago', category: 'Development', color: '#1a1535' },
  { id: 'vscode', name: 'VS Code', desc: 'Code editor with extensions and sync', icon: '💙', connected: true, lastSync: '15 min ago', category: 'Development', color: '#007acc' },
  { id: 'vercel', name: 'Vercel', desc: 'Frontend deployment and edge network', icon: '▲', connected: false, lastSync: null, category: 'Development', color: '#1a1535' },
  { id: 'stripe', name: 'Stripe', desc: 'Payment processing and subscriptions', icon: '💳', connected: true, lastSync: '1 min ago', category: 'Finance', color: '#6772e5' },
  { id: 'wise', name: 'Wise', desc: 'International transfers and multi-currency', icon: '🌍', connected: true, lastSync: '20 min ago', category: 'Finance', color: '#9fe870' },
  { id: 'quickbooks', name: 'QuickBooks', desc: 'Accounting software for freelancers', icon: '📊', connected: false, lastSync: null, category: 'Finance', color: '#2ca01c' },
  { id: 'canva', name: 'Canva', desc: 'Quick design tool for social media', icon: '🖼', connected: false, lastSync: null, category: 'Design', color: '#00c4cc' },
]

const categories = ['All', 'Productivity', 'Design', 'Development', 'Finance']

export default function IntegrationsPage() {
  const [data, setData] = useState(integrations)
  const [activeCategory, setActiveCategory] = useState('All')

  const toggle = (id: string) => {
    setData(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected, lastSync: !i.connected ? 'just now' : null } : i))
  }

  const filtered = activeCategory === 'All' ? data : data.filter(i => i.category === activeCategory)
  const connectedCount = data.filter(i => i.connected).length

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1535', letterSpacing: '-0.4px' }}>Workspace</h1>
          <p style={{ color: '#6b6899', fontSize: 14, marginTop: 2 }}>
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
              background: activeCategory === cat ? '#7c3aed' : '#fff',
              color: activeCategory === cat ? '#fff' : '#6b7280',
              border: activeCategory === cat ? 'none' : '1px solid rgba(120,100,200,0.1)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(integ => (
          <div key={integ.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid rgba(120,100,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {integ.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1535' }}>{integ.name}</div>
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
                  background: integ.connected ? '#f9fafb' : '#7c3aed',
                  color: integ.connected ? '#6b7280' : '#fff',
                  border: integ.connected ? '1px solid rgba(120,100,200,0.1)' : 'none',
                }}
              >
                {integ.connected ? <><Check size={11} /> Connected</> : <><Plus size={11} /> Connect</>}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#6b6899', marginBottom: integ.connected ? 10 : 0, lineHeight: 1.4 }}>{integ.desc}</p>
            {integ.connected && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(120,100,200,0.1)', color: '#6b6899', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <RefreshCw size={10} /> Sync
                </button>
                <button style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(120,100,200,0.1)', color: '#6b6899', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ExternalLink size={10} /> Open
                </button>
                <button style={{ width: 30, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(120,100,200,0.1)', color: '#6b6899', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
