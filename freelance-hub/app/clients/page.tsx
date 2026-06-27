'use client'

import { useState } from 'react'
import { Plus, Search, Building2, Mail, Phone, Globe, MoreHorizontal } from 'lucide-react'

const clients = [
  {
    id: 1, name: 'Emma Thompson', company: 'Tech Trophey', email: 'emma@techtrophey.com',
    phone: '+1 (555) 234-5678', website: 'techtrophey.com', avatar: '👩🏻‍💼', color: '#7c3aed',
    status: 'active', revenue: 24500, projects: 5,
  },
  {
    id: 2, name: 'James Park', company: 'Hencewood Digital', email: 'james@hencewood.io',
    phone: '+1 (555) 345-6789', website: 'hencewood.io', avatar: '👨🏻‍💻', color: '#ec4899',
    status: 'active', revenue: 18200, projects: 3,
  },
  {
    id: 3, name: 'Aisha Williams', company: 'Margono Studio', email: 'aisha@margono.co',
    phone: '+1 (555) 456-7890', website: 'margono.co', avatar: '👩🏿‍💼', color: '#f59e0b',
    status: 'active', revenue: 15800, projects: 4,
  },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1535', letterSpacing: '-0.4px' }}>Clients</h1>
          <p style={{ color: '#6b6899', fontSize: 14, marginTop: 2 }}>Manage your client relationships</p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b6899' }} />
        <input
          className="search-input"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Building2 size={48} color="#d1d5db" />
          <p style={{ color: '#6b6899', fontSize: 15 }}>No clients found</p>
          <button className="btn-primary">
            <Plus size={14} /> Add your first client
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map(client => (
            <div key={client.id} className="card card-hover" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: client.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {client.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1535' }}>{client.name}</div>
                    <div style={{ fontSize: 13, color: '#6b6899' }}>{client.company}</div>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6899', padding: 4 }}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[
                  { icon: Mail, text: client.email },
                  { icon: Phone, text: client.phone },
                  { icon: Globe, text: client.website },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={13} color="#9ca3af" />
                    <span style={{ fontSize: 12, color: '#6b6899' }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(120,100,200,0.1)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1535' }}>${client.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#6b6899' }}>Total revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1535' }}>{client.projects}</div>
                  <div style={{ fontSize: 11, color: '#6b6899' }}>Projects</div>
                </div>
                <span className="badge badge-completed">{client.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
