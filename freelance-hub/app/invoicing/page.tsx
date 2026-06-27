'use client'

import { useState } from 'react'
import { Plus, Download, Send, Eye, CheckCircle, Clock, AlertCircle, FileText, X } from 'lucide-react'

type Status = 'Paid' | 'Pending' | 'Overdue' | 'Draft'
const statusClass: Record<Status, string> = {
  Paid: 'badge badge-completed',
  Pending: 'badge badge-purple',
  Overdue: 'badge badge-high',
  Draft: 'badge badge-todo',
}

const invoices = [
  { id: 'INV-089', client: 'Tech Trophey', project: 'Brand Redesign Q4', amount: 4800, status: 'Paid' as Status, issued: 'Nov 15', due: 'Dec 15', avatar: '👩🏻‍💼', color: '#7c3aed' },
  { id: 'INV-090', client: 'Hencewood Digital', project: 'API Integration', amount: 3200, status: 'Pending' as Status, issued: 'Dec 1', due: 'Jan 1', avatar: '👨🏻‍💻', color: '#ec4899' },
  { id: 'INV-088', client: 'Margono Studio', project: 'Dashboard UI', amount: 8400, status: 'Overdue' as Status, issued: 'Oct 20', due: 'Nov 20', avatar: '👩🏿‍💼', color: '#f59e0b' },
  { id: 'INV-091', client: 'NovaBuild', project: 'Mobile App', amount: 2100, status: 'Draft' as Status, issued: 'Dec 20', due: 'Jan 20', avatar: '👨🏽‍💼', color: '#10b981' },
]

const lineItems = [
  { description: 'UI Design — Homepage & Landing', qty: 1, rate: 2400, total: 2400 },
  { description: 'Component Library (40 components)', qty: 1, rate: 1800, total: 1800 },
  { description: 'Prototype & Interactions', qty: 1, rate: 600, total: 600 },
]

export default function BillingPage() {
  const [showNew, setShowNew] = useState(false)
  const [activeStatus, setActiveStatus] = useState('All')

  const paid = invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const pending = invoices.filter(i => i.status === 'Pending').reduce((a, c) => a + c.amount, 0)
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((a, c) => a + c.amount, 0)

  const filtered = activeStatus === 'All' ? invoices : invoices.filter(i => i.status === activeStatus)

  return (
    <div style={{ padding: '28px 28px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px' }}>Billing</h1>
          <p style={{ color: '#78716c', fontSize: 14, marginTop: 2 }}>Create, send and track invoices</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={14} /> New Invoice</button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Paid', value: `$${paid.toLocaleString()}`, icon: CheckCircle, color: '#10b981', bg: '#d1fae5' },
          { label: 'Pending', value: `$${pending.toLocaleString()}`, icon: Clock, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Overdue', value: `$${overdue.toLocaleString()}`, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1c1917' }}>{value}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['All', 'Paid', 'Pending', 'Overdue', 'Draft'].map(s => (
          <button key={s} className={`tab-btn${activeStatus === s ? ' active' : ''}`} onClick={() => setActiveStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Issued', 'Due', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '13px 18px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => (
              <tr key={inv.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                <td style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{inv.id}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: inv.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{inv.avatar}</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1c1917' }}>{inv.client}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: '#78716c' }}>{inv.project}</td>
                <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: inv.status === 'Overdue' ? '#ef4444' : '#111827' }}>${inv.amount.toLocaleString()}</td>
                <td style={{ padding: '14px 18px' }}><span className={statusClass[inv.status]}>{inv.status}</span></td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: '#78716c' }}>{inv.issued}</td>
                <td style={{ padding: '14px 18px', fontSize: 13, color: inv.status === 'Overdue' ? '#ef4444' : '#6b7280', fontWeight: inv.status === 'Overdue' ? 600 : 400 }}>{inv.due}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716c' }}><Eye size={13} /></button>
                    {inv.status !== 'Paid' && (
                      <button style={{ width: 28, height: 28, borderRadius: 7, background: '#ede9fe', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7c3aed' }}><Send size={13} /></button>
                    )}
                    <button style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716c' }}><Download size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Invoice Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, width: '90%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>New Invoice</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>INV-2026-092</div>
              </div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {['Client Name', 'Client Email', 'Project Name', 'Due Date'].map(label => (
                  <div key={label}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input className="search-input" style={{ paddingLeft: 12 }} placeholder={`Enter ${label.toLowerCase()}...`} />
                  </div>
                ))}
              </div>
              {/* Line Items */}
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1c1917', marginBottom: 12 }}>Line Items</div>
              {lineItems.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {[item.description, item.qty, `$${item.rate}`, `$${item.total}`].map((val, j) => (
                    <div key={j} style={{ padding: '9px 12px', background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 13, color: j === 3 ? '#10b981' : '#374151', fontWeight: j === 3 ? 600 : 400 }}>
                      {val}
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14, marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 240 }}>
                  {[['Subtotal', '$4,800'], ['Tax (0%)', '$0'], ['Total', '$4,800']].map(([l, v], i) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: i === 2 ? '#111827' : '#6b7280', fontWeight: i === 2 ? 700 : 400 }}>{l}</span>
                      <span style={{ fontSize: 13, color: i === 2 ? '#7c3aed' : '#111827', fontWeight: i === 2 ? 700 : 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn-outline" onClick={() => setShowNew(false)}>Save Draft</button>
                <button className="btn-primary"><Send size={13} /> Send Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
