'use client'

import { useEffect, useState } from 'react'
import { Plus, Download, Send, Eye, CheckCircle, Clock, AlertCircle, X } from 'lucide-react'

type Status = 'Paid' | 'Pending' | 'Overdue' | 'Draft'
const statusClass: Record<Status, string> = {
  Paid: 'badge badge-completed',
  Pending: 'badge badge-inprogress',
  Overdue: 'badge badge-high',
  Draft: 'badge badge-todo',
}

interface Invoice {
  id: string
  client: string
  project: string
  amount: number
  status: Status
  issued: string
  due: string
  avatar: string
  color: string
}

const avatars = ['👩🏻‍💼', '👨🏻‍💻', '👩🏿‍💼', '👨🏽‍💼', '👩🏽‍🎨', '👨🏾‍💻']
const colors = ['#16a34a', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6']

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const emptyForm = { client: '', project: '', amount: '', due: '' }

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [activeStatus, setActiveStatus] = useState('All')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(rows => { setInvoices(Array.isArray(rows) ? rows : []); setLoading(false) })
  }, [])

  const paid = invoices.filter(i => i.status === 'Paid').reduce((a, c) => a + c.amount, 0)
  const pending = invoices.filter(i => i.status === 'Pending').reduce((a, c) => a + c.amount, 0)
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((a, c) => a + c.amount, 0)

  const filtered = activeStatus === 'All' ? invoices : invoices.filter(i => i.status === activeStatus)

  const subtotal = Number(form.amount) || 0

  const createInvoice = async (status: Status) => {
    if (!form.client.trim() || !subtotal) return
    const avatar = avatars[invoices.length % avatars.length]
    const color = colors[invoices.length % colors.length]
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: form.client,
        project: form.project,
        amount: subtotal,
        status,
        issued: today(),
        due: form.due || today(),
        avatar,
        color,
      }),
    })
    const created = await res.json()
    setInvoices(prev => [created, ...prev])
    setForm(emptyForm)
    setShowNew(false)
  }

  const advanceStatus = async (inv: Invoice) => {
    const next: Status = inv.status === 'Draft' ? 'Pending' : inv.status === 'Pending' ? 'Paid' : inv.status
    if (next === inv.status) return
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: next } : i))
    const res = await fetch(`/api/invoices/${inv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    const updated = await res.json()
    setInvoices(prev => prev.map(i => i.id === inv.id ? updated : i))
  }

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
          { label: 'Pending', value: `$${pending.toLocaleString()}`, icon: Clock, color: '#16a34a', bg: '#dcfce7' },
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
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#78716c', fontSize: 14 }}>Loading invoices...</div>
        ) : (
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
                <td style={{ padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>{inv.id}</td>
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
                      <button
                        onClick={() => advanceStatus(inv)}
                        title={inv.status === 'Draft' ? 'Send invoice' : 'Mark as paid'}
                        style={{ width: 28, height: 28, borderRadius: 7, background: '#dcfce7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#16a34a' }}
                      ><Send size={13} /></button>
                    )}
                    <button style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#78716c' }}><Download size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* New Invoice Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNew(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, width: '90%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1c1917' }}>New Invoice</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>Drafts and sends save instantly to your invoice list</div>
              </div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Client Name</label>
                  <input className="search-input" style={{ paddingLeft: 12 }} placeholder="Enter client name..." value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Project Name</label>
                  <input className="search-input" style={{ paddingLeft: 12 }} placeholder="Enter project name..." value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Amount</label>
                  <input className="search-input" type="number" style={{ paddingLeft: 12 }} placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', display: 'block', marginBottom: 5 }}>Due Date</label>
                  <input className="search-input" style={{ paddingLeft: 12 }} placeholder="e.g. Jan 20" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14, marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>${subtotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="btn-outline" onClick={() => createInvoice('Draft')}>Save Draft</button>
                <button className="btn-primary" onClick={() => createInvoice('Pending')}><Send size={13} /> Send Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
