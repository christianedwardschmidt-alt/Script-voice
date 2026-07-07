'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Building2, Mail, Phone, Globe, MoreHorizontal, X, Trash2 } from 'lucide-react'

interface Client {
  id: number
  name: string
  company: string
  email: string
  phone: string
  website: string
  avatar: string
  color: string
  status: string
  revenue: number
  projects: number
}

const avatars = ['👩🏻‍💼', '👨🏻‍💻', '👩🏿‍💼', '👨🏽‍💼', '👩🏽‍🎨', '👨🏾‍💻']
const colors = ['#16a34a', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']

const emptyForm = { name: '', company: '', email: '', phone: '', website: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  const createClient = async () => {
    if (!form.name.trim() || !form.company.trim()) return
    const avatar = avatars[clients.length % avatars.length]
    const color = colors[clients.length % colors.length]
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, avatar, color, status: 'active', revenue: 0, projects: 0 }),
    })
    const created = await res.json()
    setClients(prev => [created, ...prev])
    setForm(emptyForm)
    setShowModal(false)
  }

  const deleteClient = async (id: number) => {
    setOpenMenuId(null)
    setClients(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="page-pad" style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div className="page-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Clients</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Manage your client relationships</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
        <input
          className="search-input"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Building2 size={48} color="#d1d5db" />
          <p style={{ color: '#78716c', fontSize: 15 }}>No clients found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
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
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1917' }}>{client.name}</div>
                    <div style={{ fontSize: 13, color: '#78716c' }}>{client.company}</div>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', padding: 4 }}
                    onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenuId === client.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: 28, background: 'var(--card)',
                      border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 10, minWidth: 130,
                    }}>
                      <button
                        onClick={() => deleteClient(client.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13 }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {[
                  { icon: Mail, text: client.email },
                  { icon: Phone, text: client.phone },
                  { icon: Globe, text: client.website },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={13} color="#9ca3af" />
                    <span style={{ fontSize: 12, color: '#78716c' }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>${client.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#78716c' }}>Total revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>{client.projects}</div>
                  <div style={{ fontSize: 11, color: '#78716c' }}>Projects</div>
                </div>
                <span className="badge badge-completed">{client.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: 420, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#1c1917' }}>Add Client</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="search-input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="search-input" placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <input className="search-input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="search-input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="search-input" placeholder="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
              <button className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }} onClick={createClient}>
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
