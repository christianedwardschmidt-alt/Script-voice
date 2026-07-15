'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Trash2, Check, RefreshCw, Eye, Send,
  Zap, FileText, AlertCircle, Lightbulb, CheckSquare,
  Calendar, DollarSign, User, Shield, X, ChevronDown, ChevronUp,
  ExternalLink, Sparkles, Copy,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem { id: string; name: string; qty: number; rate: number; total: number }
interface Milestone { id: string; name: string; date: string; description: string }
interface Deliverable { id: string; name: string; description: string; included: boolean }

interface Proposal {
  id: number
  title: string
  client_name: string
  client_email: string
  project_type: string
  status: string
  valid_until: string | null
  share_token: string
  introduction: string
  problem: string
  solution: string
  deliverables: string
  milestones: string
  line_items: string
  payment_terms: string
  about_me: string
  terms: string
  subtotal: number
  discount: number
  total: number
  sent_at: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) }
function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 }) }
function safeParse<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) } catch { return fallback }
}

const PROJECT_TYPES = ['Consulting', 'Design', 'Development', 'Writing', 'Strategy', 'Photography', 'Marketing', 'Other']
const PAYMENT_TERMS = [
  { value: 'upon_completion', label: 'Upon completion' },
  { value: '50_upfront',      label: '50% upfront, 50% on delivery' },
  { value: 'milestone',       label: 'Milestone-based' },
  { value: 'monthly',         label: 'Monthly retainer' },
  { value: 'net_30',          label: 'NET 30' },
]

const SECTIONS = [
  { key: 'introduction', label: 'Introduction',  icon: FileText,     hint: 'Warm opening, set the stage' },
  { key: 'problem',      label: 'The Problem',   icon: AlertCircle,  hint: "Client's challenge" },
  { key: 'solution',     label: 'The Solution',  icon: Lightbulb,    hint: 'Your approach' },
  { key: 'deliverables', label: 'Deliverables',  icon: CheckSquare,  hint: "What you'll deliver" },
  { key: 'timeline',     label: 'Timeline',      icon: Calendar,     hint: 'Project milestones' },
  { key: 'investment',   label: 'Investment',    icon: DollarSign,   hint: 'Pricing & payment terms' },
  { key: 'about_me',     label: 'About Me',      icon: User,         hint: 'Your bio & experience' },
  { key: 'terms',        label: 'Terms',         icon: Shield,       hint: 'Standard terms & conditions' },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function ProposalBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('introduction')
  const [previewMode, setPreviewMode] = useState(false)
  const [sendModal, setSendModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendNote, setSendNote] = useState('')
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    const res = await fetch(`/api/proposals/${id}`)
    if (!res.ok) { router.push('/proposals'); return }
    const data: Proposal = await res.json()
    setProposal(data)
    setLineItems(safeParse(data.line_items, []))
    setMilestones(safeParse(data.milestones, []))
    setDeliverables(safeParse(data.deliverables, []))
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (patch: Partial<Proposal> & { line_items?: string; milestones?: string; deliverables?: string; [key: string]: unknown }) => {
    if (!proposal) return
    setSaving(true)
    await fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [proposal, id])

  const scheduleSave = useCallback((patch: Parameters<typeof save>[0]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(patch), 900)
  }, [save])

  const updateField = (field: keyof Proposal, value: string) => {
    if (!proposal) return
    setProposal(p => p ? { ...p, [field]: value } : p)
    scheduleSave({ [field]: value })
  }

  const updateLineItems = (items: LineItem[]) => {
    setLineItems(items)
    const subtotal = items.reduce((s, li) => s + li.total, 0)
    const discount = proposal?.discount || 0
    const total = subtotal - discount
    setProposal(p => p ? { ...p, subtotal, total } : p)
    scheduleSave({ line_items: JSON.stringify(items), subtotal, total })
  }

  const updateMilestones = (items: Milestone[]) => {
    setMilestones(items)
    scheduleSave({ milestones: JSON.stringify(items) })
  }

  const updateDeliverables = (items: Deliverable[]) => {
    setDeliverables(items)
    scheduleSave({ deliverables: JSON.stringify(items) })
  }

  const aiWrite = async (section: 'introduction' | 'problem' | 'solution') => {
    if (!proposal) return
    setAiLoading(section)
    const res = await fetch('/api/ai/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, clientName: proposal.client_name, projectType: proposal.project_type, title: proposal.title }),
    })
    if (res.ok) {
      const { text } = await res.json()
      updateField(section as keyof Proposal, text)
    }
    setAiLoading(null)
  }

  const sendProposal = async () => {
    if (!proposal) return
    setSending(true)
    const res = await fetch(`/api/proposals/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid_until: proposal.valid_until }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProposal(updated)
      setSendModal(false)
      showToast('Proposal sent!')
    }
    setSending(false)
  }

  const clientLink = proposal ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${proposal.share_token}` : ''

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <RefreshCw size={22} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!proposal) return null

  // ── Preview mode ──────────────────────────────────────────────────────────

  if (previewMode) {
    return <ProposalPreview proposal={proposal} lineItems={lineItems} milestones={milestones} deliverables={deliverables} onClose={() => setPreviewMode(false)} />
  }

  // ── Section content completeness ──────────────────────────────────────────

  const sectionFilled = {
    introduction: !!proposal.introduction,
    problem:      !!proposal.problem,
    solution:     !!proposal.solution,
    deliverables: deliverables.length > 0,
    timeline:     milestones.length > 0,
    investment:   lineItems.length > 0,
    about_me:     !!proposal.about_me,
    terms:        !!proposal.terms,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        textarea { resize: vertical; }
        .sec-btn:hover { background: #F3F4F6 !important; }
        .sec-btn.active { background: #fff !important; border-left: 3px solid var(--accent-brand) !important; }
        input[type=text]:focus, input[type=email]:focus, input[type=date]:focus, textarea:focus, select:focus { outline: 2px solid var(--accent-brand); outline-offset: -1px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, animation: 'fadeIn 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>
      )}

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E9EBF0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button onClick={() => router.push('/proposals')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Proposals
        </button>
        <div style={{ width: 1, height: 24, background: '#E9EBF0' }} />
        <input
          value={proposal.title}
          onChange={e => updateField('title', e.target.value)}
          style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#111827', border: 'none', background: 'transparent', fontFamily: 'var(--font-syne)', outline: 'none', minWidth: 0 }}
          placeholder="Proposal title…"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {saving ? (
            <span style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> Saving…
            </span>
          ) : saved ? (
            <span style={{ fontSize: 12, color: 'var(--accent-brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={11} /> Saved
            </span>
          ) : null}
          <button onClick={() => setPreviewMode(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Eye size={14} /> Preview
          </button>
          {proposal.status === 'draft' || proposal.status === 'expired' ? (
            <button onClick={() => setSendModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, background: 'var(--accent-brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(var(--accent-brand-rgb),0.35)' }}>
              <Send size={14} /> Send Proposal
            </button>
          ) : (
            <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: proposal.status === 'accepted' ? '#F0FDF4' : '#EFF6FF', color: proposal.status === 'accepted' ? 'var(--accent-brand)' : '#2563EB' }}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Body: left nav + right editor */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: section nav */}
        <div style={{ width: 240, background: '#fff', borderRight: '1px solid #E9EBF0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          {/* Proposal meta */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>PROPOSAL DETAILS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Client</label>
                <input value={proposal.client_name} onChange={e => updateField('client_name', e.target.value)}
                  placeholder="Client name…" style={{ width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Email</label>
                <input type="email" value={proposal.client_email} onChange={e => updateField('client_email', e.target.value)}
                  placeholder="client@email.com" style={{ width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Project type</label>
                <select value={proposal.project_type} onChange={e => updateField('project_type', e.target.value)}
                  style={{ width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', background: '#fff', boxSizing: 'border-box' }}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 3 }}>Valid until</label>
                <input type="date" value={proposal.valid_until || ''} onChange={e => updateField('valid_until', e.target.value)}
                  style={{ width: '100%', padding: '6px 9px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ height: 1, background: '#F3F4F6', margin: '16px 0 8px' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>SECTIONS</div>
          </div>

          {/* Section list */}
          <div style={{ flex: 1, padding: '0 8px 16px' }}>
            {SECTIONS.map(s => {
              const filled = sectionFilled[s.key as keyof typeof sectionFilled]
              const isActive = activeSection === s.key
              return (
                <button
                  key={s.key}
                  className={`sec-btn${isActive ? ' active' : ''}`}
                  onClick={() => setActiveSection(s.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', marginBottom: 2,
                    border: 'none', borderLeft: isActive ? '3px solid var(--accent-brand)' : '3px solid transparent',
                    borderRadius: isActive ? '0 8px 8px 0' : 8, background: isActive ? '#fff' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                  }}
                >
                  <s.icon size={14} color={isActive ? 'var(--accent-brand)' : filled ? '#6B7280' : '#D1D5DB'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#111827' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                    {!filled && !isActive && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{s.hint}</div>}
                  </div>
                  {filled && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-brand)', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* Client link */}
          {proposal.share_token && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>CLIENT LINK</div>
              <button onClick={() => { navigator.clipboard.writeText(clientLink); showToast('Link copied!') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#F8FAFC', fontSize: 11, color: '#6B7280', cursor: 'pointer', width: '100%' }}>
                <Copy size={11} /> Copy proposal link
              </button>
            </div>
          )}
        </div>

        {/* Right: section editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
          <SectionEditor
            section={activeSection}
            proposal={proposal}
            lineItems={lineItems}
            milestones={milestones}
            deliverables={deliverables}
            updateField={updateField}
            updateLineItems={updateLineItems}
            updateMilestones={updateMilestones}
            updateDeliverables={updateDeliverables}
            aiWrite={aiWrite}
            aiLoading={aiLoading}
          />
        </div>
      </div>

      {/* Send Modal */}
      {sendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSendModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Send Proposal</h2>
              <button onClick={() => setSendModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>To</label>
                <input value={proposal.client_email} readOnly style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#F8FAFC', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subject</label>
                <input value={`Proposal: ${proposal.title}`} readOnly style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#F8FAFC', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Personal note <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                <textarea value={sendNote} onChange={e => setSendNote(e.target.value)} placeholder="Add a short personal note to the email…" rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Client proposal link</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientLink}</div>
                  <button onClick={() => { navigator.clipboard.writeText(clientLink); showToast('Copied!') }}
                    style={{ padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer', color: '#374151', flexShrink: 0 }}>
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setSendModal(false)} style={{ flex: 1, padding: '11px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={sendProposal} disabled={sending} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: 'var(--accent-brand)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {sending ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                {sending ? 'Sending…' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section Editor ─────────────────────────────────────────────────────────────

function SectionEditor({
  section, proposal, lineItems, milestones, deliverables,
  updateField, updateLineItems, updateMilestones, updateDeliverables,
  aiWrite, aiLoading,
}: {
  section: string
  proposal: Proposal
  lineItems: LineItem[]
  milestones: Milestone[]
  deliverables: Deliverable[]
  updateField: (f: keyof Proposal, v: string) => void
  updateLineItems: (items: LineItem[]) => void
  updateMilestones: (items: Milestone[]) => void
  updateDeliverables: (items: Deliverable[]) => void
  aiWrite: (s: 'introduction' | 'problem' | 'solution') => void
  aiLoading: string | null
}) {
  const sec = SECTIONS.find(s => s.key === section)!
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
  const textareaStyle: React.CSSProperties = { width: '100%', minHeight: 180, padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.65, background: '#fff', boxSizing: 'border-box' }

  const AI_SECTIONS = ['introduction', 'problem', 'solution']

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(var(--accent-brand-rgb),0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <sec.icon size={18} color="var(--accent-brand)" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>{sec.label}</h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{sec.hint}</p>
        </div>
        {AI_SECTIONS.includes(section) && (
          <button
            onClick={() => aiWrite(section as 'introduction' | 'problem' | 'solution')}
            disabled={!!aiLoading}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            {aiLoading === section ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
            {aiLoading === section ? 'Writing…' : `AI Write ${sec.label}`}
          </button>
        )}
      </div>

      {/* Content by section type */}
      {(section === 'introduction' || section === 'problem' || section === 'solution') && (
        <div>
          <label style={labelStyle}>Content</label>
          <textarea
            value={proposal[section as 'introduction' | 'problem' | 'solution']}
            onChange={e => updateField(section as keyof Proposal, e.target.value)}
            placeholder={`Write your ${sec.label.toLowerCase()} here…`}
            style={{ ...textareaStyle, minHeight: 260 }}
          />
        </div>
      )}

      {section === 'deliverables' && (
        <DeliverableEditor items={deliverables} onChange={updateDeliverables} />
      )}

      {section === 'timeline' && (
        <MilestoneEditor items={milestones} onChange={updateMilestones} />
      )}

      {section === 'investment' && (
        <InvestmentEditor
          items={lineItems}
          onChange={updateLineItems}
          paymentTerms={proposal.payment_terms}
          onPaymentTermsChange={v => updateField('payment_terms', v)}
          discount={proposal.discount}
          onDiscountChange={v => updateField('discount', String(v))}
        />
      )}

      {section === 'about_me' && (
        <div>
          <label style={labelStyle}>Your bio</label>
          <textarea
            value={proposal.about_me}
            onChange={e => updateField('about_me', e.target.value)}
            placeholder="Tell the client about yourself, your experience, and past work…"
            style={{ ...textareaStyle, minHeight: 200 }}
          />
        </div>
      )}

      {section === 'terms' && (
        <div>
          <label style={labelStyle}>Terms & Conditions</label>
          <textarea
            value={proposal.terms}
            onChange={e => updateField('terms', e.target.value)}
            style={{ ...textareaStyle, minHeight: 240, fontFamily: 'monospace', fontSize: 13 }}
          />
        </div>
      )}
    </div>
  )
}

// ── Deliverables editor ───────────────────────────────────────────────────────

function DeliverableEditor({ items, onChange }: { items: Deliverable[]; onChange: (i: Deliverable[]) => void }) {
  const add = () => onChange([...items, { id: uid(), name: '', description: '', included: true }])
  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const update = (id: string, field: keyof Deliverable, value: string | boolean) =>
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deliverables</div>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderRadius: 7, background: 'var(--accent-brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={12} /> Add Deliverable
        </button>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13, border: '1.5px dashed #E5E7EB', borderRadius: 12 }}>
          No deliverables yet — add what you'll deliver to the client.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={item.included} onChange={e => update(item.id, 'included', e.target.checked)}
                style={{ marginTop: 3, width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-brand)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={item.name} onChange={e => update(item.id, 'name', e.target.value)}
                  placeholder="Deliverable name…" style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#111827', background: 'transparent', width: '100%' }} />
                <input value={item.description} onChange={e => update(item.id, 'description', e.target.value)}
                  placeholder="Description (optional)…" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#6B7280', background: 'transparent', width: '100%' }} />
              </div>
              <button onClick={() => remove(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Milestone editor ──────────────────────────────────────────────────────────

function MilestoneEditor({ items, onChange }: { items: Milestone[]; onChange: (i: Milestone[]) => void }) {
  const add = () => onChange([...items, { id: uid(), name: '', date: '', description: '' }])
  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const update = (id: string, field: keyof Milestone, value: string) =>
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project Milestones</div>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderRadius: 7, background: 'var(--accent-brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={12} /> Add Milestone
        </button>
      </div>

      {/* Visual timeline */}
      {items.length > 0 && (
        <div style={{ position: 'relative', paddingLeft: 28, marginBottom: 20 }}>
          <div style={{ position: 'absolute', left: 10, top: 12, bottom: 12, width: 2, background: 'linear-gradient(to bottom, var(--accent-brand), #E5E7EB)' }} />
          {items.map((item, i) => (
            <div key={item.id} style={{ position: 'relative', marginBottom: i < items.length - 1 ? 16 : 0 }}>
              <div style={{ position: 'absolute', left: -22, top: 10, width: 12, height: 12, borderRadius: '50%', background: item.name ? 'var(--accent-brand)' : '#E5E7EB', border: '2px solid #fff', boxShadow: '0 0 0 2px ' + (item.name ? 'var(--accent-brand)' : '#D1D5DB') }} />
              <div style={{ background: '#fff', border: '1px solid #E9EBF0', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 12px' }}>
                  <input value={item.name} onChange={e => update(item.id, 'name', e.target.value)}
                    placeholder="Milestone name…" style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: '#111827', background: 'transparent', gridColumn: '1' }} />
                  <input type="date" value={item.date} onChange={e => update(item.id, 'date', e.target.value)}
                    style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#374151', background: '#F8FAFC', gridColumn: '2' }} />
                  <input value={item.description} onChange={e => update(item.id, 'description', e.target.value)}
                    placeholder="Description…" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#6B7280', background: 'transparent', gridColumn: '1 / -1' }} />
                </div>
                <button onClick={() => remove(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13, border: '1.5px dashed #E5E7EB', borderRadius: 12 }}>
          No milestones yet — add key dates and deliverable checkpoints.
        </div>
      )}
    </div>
  )
}

// ── Investment editor ─────────────────────────────────────────────────────────

function InvestmentEditor({ items, onChange, paymentTerms, onPaymentTermsChange, discount, onDiscountChange }: {
  items: LineItem[]; onChange: (i: LineItem[]) => void
  paymentTerms: string; onPaymentTermsChange: (v: string) => void
  discount: number; onDiscountChange: (v: number) => void
}) {
  const add = () => onChange([...items, { id: uid(), name: '', qty: 1, rate: 0, total: 0 }])
  const remove = (id: string) => onChange(items.filter(i => i.id !== id))
  const update = (id: string, field: keyof LineItem, raw: string) => {
    const value = field === 'name' ? raw : Number(raw) || 0
    const updated = items.map(li => {
      if (li.id !== id) return li
      const next = { ...li, [field]: value }
      if (field === 'qty' || field === 'rate') next.total = next.qty * next.rate
      if (field === 'total') { next.total = Number(raw) || 0 }
      return next
    })
    onChange(updated)
  }

  const subtotal = items.reduce((s, li) => s + li.total, 0)
  const total = subtotal - (discount || 0)

  const thStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC', borderBottom: '1px solid #E9EBF0', whiteSpace: 'nowrap' }
  const tdStyle: React.CSSProperties = { padding: '8px 10px', verticalAlign: 'middle' }
  const numIn: React.CSSProperties = { width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#374151', textAlign: 'right', background: 'transparent', fontVariantNumeric: 'tabular-nums' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Line Items</div>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', borderRadius: 7, background: 'var(--accent-brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={12} /> Add Item
        </button>
      </div>

      <div style={{ border: '1px solid #E9EBF0', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '44%' }}>Item</th>
              <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>Qty</th>
              <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Rate</th>
              <th style={{ ...thStyle, width: '20%', textAlign: 'right' }}>Total</th>
              <th style={{ ...thStyle, width: '4%' }} />
            </tr>
          </thead>
          <tbody>
            {items.map((li, i) => (
              <tr key={li.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td style={tdStyle}>
                  <input value={li.name} onChange={e => update(li.id, 'name', e.target.value)}
                    placeholder="Item description…" style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', width: '100%' }} />
                </td>
                <td style={tdStyle}><input value={li.qty} onChange={e => update(li.id, 'qty', e.target.value)} type="number" min="0" style={{ ...numIn, width: 50 }} /></td>
                <td style={tdStyle}><input value={li.rate} onChange={e => update(li.id, 'rate', e.target.value)} type="number" min="0" style={{ ...numIn }} /></td>
                <td style={tdStyle}><input value={li.total} onChange={e => update(li.id, 'total', e.target.value)} type="number" min="0" style={{ ...numIn, fontWeight: 600 }} /></td>
                <td style={tdStyle}><button onClick={() => remove(li.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB' }}><Trash2 size={12} /></button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No items yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: 260 }}>
          {[
            { label: 'Subtotal', value: `$${subtotal.toLocaleString()}` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#6B7280' }}>
              <span>{row.label}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13, color: '#6B7280' }}>
            <span>Discount</span>
            <input type="number" min="0" value={discount || ''} onChange={e => onDiscountChange(Number(e.target.value))}
              placeholder="0" style={{ width: 80, textAlign: 'right', border: '1px solid #E5E7EB', borderRadius: 6, padding: '3px 8px', fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', fontSize: 18, fontWeight: 700, color: '#111827', borderTop: '2px solid #111827', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-syne)' }}>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>${Math.max(0, total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment terms */}
      <div style={{ marginTop: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Payment Terms</label>
        <select value={paymentTerms} onChange={e => onPaymentTermsChange(e.target.value)}
          style={{ width: '100%', maxWidth: 320, padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#fff' }}>
          {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
    </div>
  )
}

// ── Preview component ─────────────────────────────────────────────────────────

function ProposalPreview({ proposal, lineItems, milestones, deliverables, onClose }: {
  proposal: Proposal
  lineItems: LineItem[]
  milestones: Milestone[]
  deliverables: Deliverable[]
  onClose: () => void
}) {
  const paymentLabel = PAYMENT_TERMS.find(t => t.value === proposal.payment_terms)?.label || proposal.payment_terms
  const subtotal = lineItems.reduce((s, li) => s + li.total, 0)
  const total = subtotal - (proposal.discount || 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F0F2F5', zIndex: 300, overflowY: 'auto' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16, zIndex: 10 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
          <ArrowLeft size={13} /> Back to editor
        </button>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Preview — this is exactly what your client will see</span>
        <button
          onClick={() => window.open(`/p/${proposal.share_token}`, '_blank')}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer' }}
        >
          <ExternalLink size={12} /> Open client view
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '64px auto 80px', padding: '0 24px' }}>
        {/* Proposal document */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Header strip */}
          <div style={{ background: '#111827', padding: '36px 48px', color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Proposal</div>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 32, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.15 }}>{proposal.title || 'Untitled Proposal'}</h1>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.65)', flexWrap: 'wrap' }}>
              {proposal.client_name && <span>Prepared for {proposal.client_name}</span>}
              {proposal.valid_until && <span>Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
              {total > 0 && <span style={{ color: '#4ADE80', fontWeight: 600 }}>${total.toLocaleString()}</span>}
            </div>
          </div>

          <div style={{ padding: '40px 48px' }}>
            {proposal.introduction && <ProposalSection title="Introduction" content={proposal.introduction} />}
            {proposal.problem && <ProposalSection title="The Problem" content={proposal.problem} />}
            {proposal.solution && <ProposalSection title="The Solution" content={proposal.solution} />}

            {deliverables.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #F3F4F6' }}>Deliverables</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deliverables.map(d => (
                    <div key={d.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, background: d.included ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${d.included ? '#DCFCE7' : '#F3F4F6'}`, opacity: d.included ? 1 : 0.6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: d.included ? 'var(--accent-brand)' : '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {d.included && <Check size={11} color="#fff" strokeWidth={2.5} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{d.name}</div>
                        {d.description && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{d.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {milestones.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #F3F4F6' }}>Timeline</h2>
                <div style={{ position: 'relative', paddingLeft: 28 }}>
                  <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: 'linear-gradient(to bottom, var(--accent-brand) 0%, #E5E7EB 100%)' }} />
                  {milestones.map((m, i) => (
                    <div key={m.id} style={{ position: 'relative', marginBottom: i < milestones.length - 1 ? 16 : 0 }}>
                      <div style={{ position: 'absolute', left: -22, top: 6, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-brand)', border: '2px solid #fff', boxShadow: '0 0 0 2px var(--accent-brand)' }} />
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.name}</span>
                          {m.date && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                        {m.description && <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>{m.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineItems.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #F3F4F6' }}>Investment</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderRadius: 8 }}>
                      {['Item', 'Qty', 'Rate', 'Total'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Item' ? 'left' : 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={li.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px', color: '#374151', fontWeight: 500 }}>{li.name}</td>
                        <td style={{ padding: '12px', color: '#6B7280', textAlign: 'right' }}>{li.qty}</td>
                        <td style={{ padding: '12px', color: '#6B7280', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${li.rate.toLocaleString()}</td>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${li.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#6B7280' }}>
                      <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
                    </div>
                    {(proposal.discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: 'var(--accent-brand)' }}>
                        <span>Discount</span><span>−${(proposal.discount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 6px', fontSize: 20, fontWeight: 700, color: '#111827', borderTop: '2px solid #111827', marginTop: 6 }}>
                      <span style={{ fontFamily: 'var(--font-syne)' }}>Total</span>
                      <span>${Math.max(0, total).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 }}>{paymentLabel}</div>
                  </div>
                </div>
              </div>
            )}

            {proposal.about_me && <ProposalSection title="About Me" content={proposal.about_me} />}
            {proposal.terms && <ProposalSection title="Terms & Conditions" content={proposal.terms} mono />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposalSection({ title, content, mono }: { title: string; content: string; mono?: boolean }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid #F3F4F6' }}>{title}</h2>
      <p style={{ color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 12 : 14 }}>{content}</p>
    </div>
  )
}
