'use client'

import { useState } from 'react'
import {
  ExternalLink,
  Check,
  Plus,
  Settings,
  RefreshCw,
  Zap,
  Globe,
  Code2,
  Layers,
  FileCode,
  Puzzle,
} from 'lucide-react'

const integrationCategories = [
  {
    id: 'productivity',
    label: 'Productivity',
    icon: Layers,
    integrations: [
      {
        id: 'microsoft-365',
        name: 'Microsoft 365',
        description: 'Word, Excel, PowerPoint, Outlook, Teams & OneDrive',
        icon: '🪟',
        connected: true,
        color: '#0078d4',
        features: ['Document editing', 'Spreadsheets', 'Email sync', 'Calendar'],
        lastSync: '2 min ago',
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'All-in-one workspace for notes, docs & databases',
        icon: '◼',
        connected: true,
        color: '#f1f5f9',
        features: ['Page sync', 'Database import', 'Task templates', 'Wiki'],
        lastSync: '5 min ago',
      },
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        description: 'Docs, Sheets, Drive, Gmail & Calendar',
        icon: '🔵',
        connected: false,
        color: '#4285f4',
        features: ['Drive sync', 'Doc editing', 'Gmail', 'Calendar'],
        lastSync: null,
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication and collaboration platform',
        icon: '💬',
        connected: true,
        color: '#4a154b',
        features: ['Client channels', 'Notifications', 'File sharing', 'Status'],
        lastSync: '1 min ago',
      },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    icon: Layers,
    integrations: [
      {
        id: 'figma',
        name: 'Figma',
        description: 'Collaborative design and prototyping tool',
        icon: '🎨',
        connected: true,
        color: '#f24e1e',
        features: ['Project sync', 'Asset export', 'Version history', 'Comments'],
        lastSync: '10 min ago',
      },
      {
        id: 'adobe-cc',
        name: 'Adobe Creative Cloud',
        description: 'Photoshop, Illustrator, XD, Premiere & more',
        icon: '🔴',
        connected: false,
        color: '#ff0000',
        features: ['File sync', 'Asset libraries', 'Fonts', 'Templates'],
        lastSync: null,
      },
      {
        id: 'canva',
        name: 'Canva',
        description: 'Quick design tool for social media & presentations',
        icon: '🖼',
        connected: false,
        color: '#00c4cc',
        features: ['Brand kit', 'Templates', 'Export', 'Scheduling'],
        lastSync: null,
      },
    ],
  },
  {
    id: 'development',
    label: 'Development',
    icon: Code2,
    integrations: [
      {
        id: 'github',
        name: 'GitHub',
        description: 'Version control and code collaboration',
        icon: '🐙',
        connected: true,
        color: '#f0f6ff',
        features: ['Repo sync', 'PR tracking', 'Issues', 'Actions CI'],
        lastSync: '3 min ago',
      },
      {
        id: 'vscode',
        name: 'VS Code',
        description: 'Code editor with extensions and workspace sync',
        icon: '💙',
        connected: true,
        color: '#007acc',
        features: ['Settings sync', 'Extensions', 'Snippets', 'Workspace'],
        lastSync: '15 min ago',
      },
      {
        id: 'vercel',
        name: 'Vercel',
        description: 'Frontend deployment and edge network platform',
        icon: '▲',
        connected: false,
        color: '#f1f5f9',
        features: ['Deploy', 'Analytics', 'Domains', 'Edge functions'],
        lastSync: null,
      },
      {
        id: 'supabase',
        name: 'Supabase',
        description: 'Open source Firebase alternative with Postgres',
        icon: '⚡',
        connected: false,
        color: '#3ecf8e',
        features: ['Database', 'Auth', 'Storage', 'Edge functions'],
        lastSync: null,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Globe,
    integrations: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing and subscription management',
        icon: '💳',
        connected: true,
        color: '#6772e5',
        features: ['Payments', 'Subscriptions', 'Invoicing', 'Payouts'],
        lastSync: '1 min ago',
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Accounting software for freelancers & small biz',
        icon: '📊',
        connected: false,
        color: '#2ca01c',
        features: ['Bookkeeping', 'Tax prep', 'Invoicing', 'Reports'],
        lastSync: null,
      },
      {
        id: 'wise',
        name: 'Wise',
        description: 'International money transfers and multi-currency',
        icon: '🌍',
        connected: true,
        color: '#9fe870',
        features: ['Multi-currency', 'Transfers', 'Debit card', 'Rates'],
        lastSync: '20 min ago',
      },
    ],
  },
]

function IntegrationCard({ integration, onToggle }: { integration: (typeof integrationCategories)[0]['integrations'][0], onToggle: () => void }) {
  return (
    <div className="card-hover" style={{ background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${integration.color}15`, border: `1px solid ${integration.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {integration.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{integration.name}</div>
            {integration.connected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 11, color: '#10b981' }}>Connected · {integration.lastSync}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {integration.connected && (
            <button style={{ width: 30, height: 30, borderRadius: 8, background: '#141428', border: '1px solid #252545', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
              <Settings size={13} />
            </button>
          )}
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: integration.connected ? '#111120' : '#6366f1',
              color: integration.connected ? '#64748b' : '#fff',
              border: integration.connected ? '1px solid #252545' : 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {integration.connected ? (
              <>
                <Check size={12} />
                Connected
              </>
            ) : (
              <>
                <Plus size={12} />
                Connect
              </>
            )}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{integration.description}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {integration.features.map((feat) => (
          <span key={feat} style={{ fontSize: 10, color: integration.connected ? '#818cf8' : '#475569', background: integration.connected ? '#6366f112' : '#1a1a30', padding: '3px 8px', borderRadius: 10, fontWeight: 500 }}>
            {feat}
          </span>
        ))}
      </div>

      {integration.connected && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#141428', border: '1px solid #252545', color: '#64748b', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <RefreshCw size={11} />
            Sync Now
          </button>
          <button style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#141428', border: '1px solid #252545', color: '#64748b', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <ExternalLink size={11} />
            Open App
          </button>
        </div>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const [data, setData] = useState(integrationCategories)
  const [activeTab, setActiveTab] = useState('All')

  const connectedCount = data.flatMap(c => c.integrations).filter(i => i.connected).length
  const totalCount = data.flatMap(c => c.integrations).length

  const toggleIntegration = (categoryId: string, integrationId: string) => {
    setData(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat
      return {
        ...cat,
        integrations: cat.integrations.map(integ => {
          if (integ.id !== integrationId) return integ
          return {
            ...integ,
            connected: !integ.connected,
            lastSync: !integ.connected ? 'just now' : null,
          }
        }),
      }
    }))
  }

  const tabs = ['All', ...data.map(c => c.label)]

  const filteredCategories = activeTab === 'All' ? data : data.filter(c => c.label === activeTab)

  return (
    <div style={{ padding: '28px 32px', background: '#07070f', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Integrations</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Connect your favorite tools — {connectedCount}/{totalCount} connected
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}>
          <Puzzle size={14} />
          Browse Marketplace
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Connected', value: connectedCount, color: '#10b981', icon: Check },
          { label: 'Available', value: totalCount - connectedCount, color: '#6366f1', icon: Plus },
          { label: 'Auto-Sync', value: connectedCount, color: '#8b5cf6', icon: RefreshCw },
          { label: 'Webhooks', value: '6', color: '#f59e0b', icon: Zap },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card-hover" style={{ background: '#0e0e1c', border: '1px solid #1a1a30', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? '#6366f1' : '#0e0e1c',
              color: activeTab === tab ? '#fff' : '#64748b',
              border: activeTab === tab ? 'none' : '1px solid #1a1a30',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Integration categories */}
      {filteredCategories.map((category) => {
        const Icon = category.icon
        return (
          <div key={category.id} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icon size={16} color="#6366f1" />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{category.label}</span>
              <span style={{ fontSize: 12, color: '#475569', marginLeft: 4 }}>
                {category.integrations.filter(i => i.connected).length}/{category.integrations.length} connected
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {category.integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onToggle={() => toggleIntegration(category.id, integration.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
