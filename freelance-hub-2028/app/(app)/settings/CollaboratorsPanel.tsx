'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react'

interface Collaborator {
  id: number
  collaborator_name: string
  collaborator_email: string
  collaborator_user_id: number | null
  relationship: string
  is_guildwire_member: boolean
  created_at: string
}

const RELATIONSHIPS = ['Virtual Assistant', 'Associate', 'Contractor', 'Editor', 'Accountant', 'Other']

const RELATIONSHIP_COLORS: Record<string, string> = {
  'Virtual Assistant': '#0EA5E9',
  Associate: '#8B5CF6',
  Contractor: '#D97706',
  Editor: '#EC4899',
  Accountant: '#16A34A',
  Other: '#6B7280',
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function CollaboratorsPanel() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [showSlideOver, setShowSlideOver] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRelationship, setFormRelationship] = useState(RELATIONSHIPS[0])
  const [saving, setSaving] = useState(false)
  const [justAddedId, setJustAddedId] = useState<number | null>(null)

  const load = () => {
    fetch('/api/collaborators')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCollaborators(data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditingId(null)
    setFormName('')
    setFormEmail('')
    setFormRelationship(RELATIONSHIPS[0])
    setShowSlideOver(true)
  }

  function openEdit(c: Collaborator) {
    setEditingId(c.id)
    setFormName(c.collaborator_name)
    setFormEmail(c.collaborator_email)
    setFormRelationship(c.relationship)
    setShowSlideOver(true)
  }

  async function save() {
    if (!formName.trim() || !formEmail.trim() || saving) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/collaborators/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, email: formEmail, relationship: formRelationship }),
        })
        if (res.ok) {
          const updated = await res.json()
          setCollaborators(prev => prev.map(c => c.id === editingId ? updated : c))
        }
      } else {
        const res = await fetch('/api/collaborators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, email: formEmail, relationship: formRelationship }),
        })
        if (res.ok) {
          const created = await res.json()
          setCollaborators(prev => [created, ...prev])
          setJustAddedId(created.id)
          setTimeout(() => setJustAddedId(null), 900)
        }
      }
      setShowSlideOver(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Remove this collaborator? Agents will no longer be able to notify them.')) return
    await fetch(`/api/collaborators/${id}`, { method: 'DELETE' })
    setCollaborators(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <style>{`
        @keyframes collab-card-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes collab-check-pop { 0% { opacity: 0; transform: scale(0.5); } 40% { opacity: 1; transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes collab-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes collab-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        .collab-row-fresh { animation: collab-card-in 200ms ease; }
        .collab-icon-btn:hover { background: #F3F4F6 !important; }
      `}</style>

      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
        Your Collaborators
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6B7280', margin: '0 0 18px', maxWidth: 480, lineHeight: 1.5 }}>
        People you work with who can receive notifications from your GuildWire agents. They don&apos;t need to be GuildWire members.
      </p>

      <button
        onClick={openAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-body)', marginBottom: 20,
        }}
      >
        <Plus size={14} /> Add Collaborator
      </button>

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>Loading…</div>
      ) : collaborators.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
          {collaborators.map(c => (
            <div
              key={c.id}
              className={justAddedId === c.id ? 'collab-row-fresh' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: `${RELATIONSHIP_COLORS[c.relationship] ?? '#6B7280'}20`,
                color: RELATIONSHIP_COLORS[c.relationship] ?? '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
              }}>
                {initials(c.collaborator_name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.collaborator_name}</span>
                  {c.is_guildwire_member && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600,
                      color: '#16A34A', background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 20,
                      fontFamily: 'var(--font-body)',
                    }}>
                      {justAddedId === c.id && <Check size={10} style={{ animation: 'collab-check-pop 400ms ease' }} />}
                      GuildWire Member
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: '#6B7280', marginTop: 1 }}>{c.collaborator_email}</div>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: `${RELATIONSHIP_COLORS[c.relationship] ?? '#6B7280'}14`,
                color: RELATIONSHIP_COLORS[c.relationship] ?? '#6B7280', fontFamily: 'var(--font-body)', flexShrink: 0,
              }}>
                {c.relationship}
              </span>

              <button className="collab-icon-btn" onClick={() => openEdit(c)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexShrink: 0 }}>
                <Pencil size={13} />
              </button>
              <button className="collab-icon-btn" onClick={() => remove(c.id)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showSlideOver && (
        <>
          <div
            onClick={() => setShowSlideOver(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.4)', zIndex: 1000, animation: 'collab-overlay-in 0.15s ease' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: 400, maxWidth: '90vw',
            background: '#fff', zIndex: 1001, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            animation: 'collab-slide-in 0.22s ease', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {editingId ? 'Edit Collaborator' : 'Add Collaborator'}
              </span>
              <button onClick={() => setShowSlideOver(false)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,17,23,0.4)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Collaborator Name
              </label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Priya Nair"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
              />

              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Collaborator Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="priya@example.com"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
              />

              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Relationship
              </label>
              <select
                value={formRelationship}
                onChange={e => setFormRelationship(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              >
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={save}
                disabled={!formName.trim() || !formEmail.trim() || saving}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                  background: (formName.trim() && formEmail.trim()) ? '#16A34A' : '#D1D5DB', color: '#fff',
                  fontSize: 13.5, fontWeight: 700, cursor: (formName.trim() && formEmail.trim()) ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Collaborator'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ position: 'relative', width: 84, height: 52, margin: '0 auto 20px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(22,163,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#16A34A',
        }}>
          You
        </div>
        <div style={{
          position: 'absolute', right: 0, top: 0, width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(22,163,74,0.06)', border: '1.5px dashed #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: '#86EFAC',
        }}>
          +
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-syne)', fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        The people in your corner.
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
        Add the people you work with so your agents can keep them in the loop automatically.
      </p>
    </div>
  )
}
