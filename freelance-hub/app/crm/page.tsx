'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  Star,
  StarOff,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  MessageSquare,
  Calendar,
  ArrowRight,
} from 'lucide-react'

type PipelineStage = 'Lead' | 'Proposal' | 'Negotiation' | 'Active' | 'Completed'

const pipelineStages: PipelineStage[] = ['Lead', 'Proposal', 'Negotiation', 'Active', 'Completed']

const stageColors: Record<PipelineStage, string> = {
  Lead: '#78716c',
  Proposal: '#16a34a',
  Negotiation: '#d97706',
  Active: '#22c55e',
  Completed: '#14b8a6',
}

interface Client {
  id: number
  name: string
  company: string
  email: string
  phone: string
  website: string
  stage: PipelineStage
  value: number
  avatar: string
  avatarBg: string
  tags: string[]
  lastContact: string
  starred: boolean
  rating: number
  notes: string
}

const clients: Client[] = [
  {
    id: 1, name: 'Emma Thompson', company: 'Acme Corp', email: 'emma@acmecorp.com',
    phone: '+1 (555) 234-5678', website: 'acmecorp.com', stage: 'Active', value: 18500,
    avatar: '👩🏻‍💼', avatarBg: '#16a34a', tags: ['Design', 'Retainer'], lastContact: '1h ago',
    starred: true, rating: 5, notes: 'Long-term client. Pays on time. Expanding to mobile app.',
  },
  {
    id: 2, name: 'James Park', company: 'TechFlow Inc', email: 'jpark@techflow.io',
    phone: '+1 (555) 345-6789', website: 'techflow.io', stage: 'Proposal', value: 12000,
    avatar: '👨🏻‍💻', avatarBg: '#22c55e', tags: ['Development', 'API'], lastContact: '3h ago',
    starred: false, rating: 4, notes: 'Needs detailed scope. Budget is flexible if scope is clear.',
  },
  {
    id: 3, name: 'Aisha Williams', company: 'Bright Ideas Co', email: 'aisha@brightideas.co',
    phone: '+1 (555) 456-7890', website: 'brightideas.co', stage: 'Negotiation', value: 9800,
    avatar: '👩🏿‍💼', avatarBg: '#d97706', tags: ['Marketing', 'Content'], lastContact: '1d ago',
    starred: true, rating: 4, notes: 'Negotiating on timeline. They want delivery in 3 weeks.',
  },
  {
    id: 4, name: 'Carlos Mendez', company: 'DataSync', email: 'carlos@datasync.io',
    phone: '+1 (555) 567-8901', website: 'datasync.io', stage: 'Active', value: 24000,
    avatar: '👨🏽‍💼', avatarBg: '#14b8a6', tags: ['Development', 'Data', 'Premium'], lastContact: '2d ago',
    starred: false, rating: 5, notes: 'High-value client. Careful with deadlines. C-level contacts.',
  },
  {
    id: 5, name: 'Sophie Laurent', company: 'NovaBuild', email: 'sophie@novabuild.fr',
    phone: '+33 1 23 45 67 89', website: 'novabuild.fr', stage: 'Lead', value: 35000,
    avatar: '👩🏻‍🎨', avatarBg: '#78716c', tags: ['Design', 'Enterprise', 'New'], lastContact: '3d ago',
    starred: true, rating: 3, notes: 'Warm lead from LinkedIn. Need to schedule discovery call.',
  },
  {
    id: 6, name: 'Raj Patel', company: 'InnovateTech', email: 'raj@innovatetech.in',
    phone: '+91 98765 43210', website: 'innovatetech.in', stage: 'Completed', value: 8200,
    avatar: '👨🏽‍💻', avatarBg: '#4ade80', tags: ['Development', 'Completed'], lastContact: '2w ago',
    starred: false, rating: 4, notes: 'Project completed successfully. Ask for referral.',
  },
]

const tagColors: Record<string, string> = {
  Design: '#16a34a',
  Development: '#22c55e',
  Marketing: '#d97706',
  Content: '#d97706',
  API: '#14b8a6',
  Data: '#14b8a6',
  Retainer: '#4ade80',
  Premium: '#4ade80',
  Enterprise: '#22c55e',
  New: '#16a34a',
  Completed: '#78716c',
}

export default function CRMPage() {
  const [data, setData] = useState(clients)
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list')
  const [selectedStage, setSelectedStage] = useState<string>('All')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filtered = data.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchStage = selectedStage === 'All' || c.stage === selectedStage
    return matchSearch && matchStage
  })

  const totalValue = data.reduce((a, c) => a + c.value, 0)
  const activeCount = data.filter(c => c.stage === 'Active').length
  const avgValue = Math.round(totalValue / data.length)

  const toggleStar = (id: number) => {
    setData(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c))
  }

  return (
    <div style={{ padding: '28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>CRM</h1>
          <p style={{ fontSize: 14, color: '#78716c', marginTop: 2 }}>Manage client relationships & pipeline</p>
        </div>
        <button className="btn-primary">
          <Plus size={14} />
          Add Client
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Pipeline', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: '#16a34a' },
          { label: 'Active Clients', value: activeCount, icon: Users, color: '#22c55e' },
          { label: 'Avg Deal Size', value: `$${avgValue.toLocaleString()}`, icon: TrendingUp, color: '#14b8a6' },
          { label: 'Avg Response', value: '2.4h', icon: Clock, color: '#d97706' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card card-hover" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1c1917' }}>{value}</div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Overview */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917', marginBottom: 16 }}>Pipeline Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {pipelineStages.map((stage) => {
            const stageClients = data.filter(c => c.stage === stage)
            const stageValue = stageClients.reduce((a, c) => a + c.value, 0)
            const color = stageColors[stage]
            return (
              <div
                key={stage}
                onClick={() => setSelectedStage(selectedStage === stage ? 'All' : stage)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: selectedStage === stage ? `${color}15` : 'var(--bg-2)',
                  border: `1px solid ${selectedStage === stage ? color + '40' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{stage}</span>
                  <span style={{ fontSize: 12, color: '#78716c', background: 'var(--card)', padding: '1px 8px', borderRadius: 10 }}>
                    {stageClients.length}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>${stageValue.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#78716c' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="search-input"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <button className="btn-outline">
          <Filter size={13} />
          Filter
        </button>
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {(['list', 'kanban'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              style={{
                padding: '8px 14px',
                background: activeView === v ? '#16a34a' : 'none',
                border: 'none',
                color: activeView === v ? '#fff' : '#78716c',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedClient ? '1fr 380px' : '1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Client', 'Stage', 'Value', 'Tags', 'Last Contact', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', padding: '14px 16px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedClient?.id === client.id ? '#16a34a08' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  className="card-hover"
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${client.avatarBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {client.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{client.name}</div>
                        <div style={{ fontSize: 11, color: '#78716c' }}>{client.company}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: stageColors[client.stage], background: `${stageColors[client.stage]}18`, padding: '3px 10px', borderRadius: 20 }}>
                      {client.stage}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                    ${client.value.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {client.tags.slice(0, 2).map((tag) => (
                        <span key={tag} style={{ fontSize: 10, color: tagColors[tag] || '#16a34a', background: `${tagColors[tag] || '#16a34a'}18`, padding: '2px 7px', borderRadius: 10 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#78716c' }}>{client.lastContact}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(client.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: client.starred ? '#d97706' : '#a8a29e', padding: 4 }}
                      >
                        {client.starred ? <Star size={14} fill="#d97706" /> : <StarOff size={14} />}
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4 }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Client Detail Panel */}
        {selectedClient && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${selectedClient.avatarBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {selectedClient.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>{selectedClient.name}</div>
                  <div style={{ fontSize: 12, color: '#78716c' }}>{selectedClient.company}</div>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: 18 }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {selectedClient.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 10, color: tagColors[tag] || '#16a34a', background: `${tagColors[tag] || '#16a34a'}18`, padding: '3px 9px', borderRadius: 10, fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { icon: Mail, label: 'Email' },
                { icon: Phone, label: 'Call' },
                { icon: MessageSquare, label: 'Message' },
                { icon: Calendar, label: 'Meet' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', color: '#5b5894', fontSize: 11, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { icon: Mail, label: 'Email', value: selectedClient.email },
                { icon: Phone, label: 'Phone', value: selectedClient.phone },
                { icon: Globe, label: 'Website', value: selectedClient.website },
                { icon: DollarSign, label: 'Deal Value', value: `$${selectedClient.value.toLocaleString()}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Icon size={14} color="#a8a29e" />
                  <span style={{ fontSize: 11, color: '#a8a29e', width: 64 }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#1c1917' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#78716c', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#1c1917', lineHeight: 1.5 }}>{selectedClient.notes}</div>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              View Full Profile
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
