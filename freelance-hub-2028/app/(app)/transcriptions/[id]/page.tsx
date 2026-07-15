'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Pencil, Play, Pause, SkipBack, SkipForward,
  Search, Sparkles, CheckSquare, Clock, User, Tag, X,
  Download, FileText, Share2, Plus, Check, Copy, Loader,
} from 'lucide-react'

type Params = Promise<{ id: string }>

const SPEAKERS: Record<string, string> = {
  You:   '#3B82F6',
  Sarah: '#EC4899',
}

const TRANSCRIPT = [
  { id: 't1',  time: '00:00', speaker: 'You',   text: "Hi Sarah, thanks for making time today. I've been looking forward to this call — I've been doing a lot of SaaS work lately and your project sounds really interesting." },
  { id: 't2',  time: '00:12', speaker: 'Sarah', text: "Of course! I appreciate you reaching out. I've been looking for a freelance UX designer who really understands B2B SaaS for a while now. Most designers I've talked to come from consumer apps and it just doesn't translate." },
  { id: 't3',  time: '00:38', speaker: 'You',   text: "That's a really common gap. B2B has such different user behavior — the people using the product often aren't the ones who chose it, so the onboarding experience has to work for skeptical, time-constrained users." },
  { id: 't4',  time: '01:02', speaker: 'Sarah', text: "Exactly. And that's our exact problem. Our onboarding flow was designed three years ago when we had maybe 20 clients. Now we're at 200 and users are dropping off at step 3 of the setup wizard at an alarming rate." },
  { id: 't5',  time: '01:28', speaker: 'You',   text: "Do you have data on where they're dropping? Step 3 in a wizard is usually where you ask for the first real configuration — connecting data, setting up integrations, something that requires context the user might not have handy." },
  { id: 't6',  time: '01:44', speaker: 'Sarah', text: "Yes, exactly. Step 3 is where we ask them to connect their CRM. About 60% of people who reach that step don't complete it. They close the tab and we end up doing a whole manual follow-up campaign." },
  { id: 't7',  time: '02:10', speaker: 'You',   text: "That's a very solvable problem. A few approaches come to mind — progressive disclosure where you let them skip and come back, or a guided integration wizard that walks them through the connection step by step." },
  { id: 't8',  time: '02:35', speaker: 'Sarah', text: "The skip option is something we've discussed internally, but I'm worried people will skip everything and never return. What does the data usually show for that pattern?" },
  { id: 't9',  time: '02:58', speaker: 'You',   text: "It depends heavily on the re-engagement sequence that follows. If you have strong email and in-app prompts, skip rates actually improve activation because the initial friction is lower. I've seen it work really well for tools in your category." },
  { id: 't10', time: '03:22', speaker: 'Sarah', text: "That's interesting. And in terms of timeline — we have a board presentation in about four months and I'd really love to have this shipped by then. Is that feasible for a project like this?" },
  { id: 't11', time: '03:41', speaker: 'You',   text: "Four months is very workable for a focused onboarding redesign. I'd estimate 6–8 weeks for discovery and design, a couple of weeks for developer handoff, leaving buffer for revisions and testing before your deadline." },
  { id: 't12', time: '04:05', speaker: 'Sarah', text: "That sounds great. In terms of budget, we're thinking $15,000 to $20,000 for the design work. Does that fit what you typically work with for a project of this scope?" },
  { id: 't13', time: '04:22', speaker: 'You',   text: "Yes, that's well within range. For a full onboarding redesign with discovery, UX, UI, and developer handoff docs, I'd scope it closer to $18,000–$22,000 depending on the number of iterations we need." },
  { id: 't14', time: '04:48', speaker: 'Sarah', text: "That's still in the right ballpark. I think we can make that work. Can you send some examples of similar onboarding projects? I'd love to show the team before we finalize." },
  { id: 't15', time: '05:06', speaker: 'You',   text: "Absolutely. I'll put together a case study deck with three or four relevant projects focused on B2B SaaS onboarding and activation flows. I can have that over to you by end of week." },
]

const INITIAL_ACTIONS = [
  { id: 'a1', text: 'Send portfolio of SaaS onboarding case studies by end of week', done: false, due: 'Jul 11, 2026' },
  { id: 'a2', text: 'Prepare initial discovery questionnaire for Sarah', done: false, due: 'Jul 12, 2026' },
  { id: 'a3', text: 'Schedule follow-up call for next week', done: false, due: 'Jul 14, 2026' },
  { id: 'a4', text: 'Draft project proposal with timeline + pricing ($18K–$22K)', done: false, due: 'Jul 15, 2026' },
  { id: 'a5', text: 'Request access to their analytics data (Sarah will share)', done: false, due: undefined },
]

const KEY_MOMENTS = [
  { time: '01:02', label: 'Core problem described — 60% drop-off at CRM connection step' },
  { time: '02:10', label: 'Solution approaches discussed — progressive disclosure + guided wizard' },
  { time: '03:22', label: 'Timeline established — 4 months to board presentation' },
  { time: '04:05', label: 'Budget discussed — $15K–$20K range confirmed' },
  { time: '05:06', label: 'Next steps agreed — case study deck by end of week' },
]

const INITIAL_TAGS = ['Discovery', 'SaaS', 'Onboarding', 'High-value']

function timeToSecs(t: string) {
  const [m, s] = t.split(':').map(Number)
  return m * 60 + s
}

export default function TranscriptionDetailPage({ params }: { params: Params }) {
  const { id } = use(params)

  const [title, setTitle] = useState('Discovery Call — Sarah Chen')
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0) // 0–100
  const [speed, setSpeed] = useState('1x')
  const [search, setSearch] = useState('')
  const [actions, setActions] = useState(INITIAL_ACTIONS)
  const [tags, setTags] = useState(INITIAL_TAGS)
  const [newTag, setNewTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addingAction, setAddingAction] = useState(false)
  const [newAction, setNewAction] = useState('')

  const DURATION_SECS = 2712 // 45:12

  function toggleAction(id: string) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }

  function addAction() {
    if (newAction.trim()) {
      setActions(prev => [...prev, { id: `a${Date.now()}`, text: newAction.trim(), done: false, due: undefined }])
    }
    setNewAction('')
    setAddingAction(false)
  }

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()])
    }
    setNewTag('')
    setAddingTag(false)
  }

  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)) }

  function jumpTo(secs: number) {
    setPlayhead((secs / DURATION_SECS) * 100)
  }

  function handleShare() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  function highlight(text: string): React.ReactNode {
    if (!search.trim()) return text
    const re = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.split(re).map((part, i) =>
      re.test(part) ? <mark key={i} style={{ background: '#FEF08A', borderRadius: 2, padding: '0 1px' }}>{part}</mark> : part
    )
  }

  const filteredTranscript = search.trim()
    ? TRANSCRIPT.filter(t =>
        t.text.toLowerCase().includes(search.toLowerCase()) ||
        t.speaker.toLowerCase().includes(search.toLowerCase())
      )
    : TRANSCRIPT

  const playheadSecs = (playhead / 100) * DURATION_SECS
  const playheadFmt = `${String(Math.floor(playheadSecs / 60)).padStart(2,'0')}:${String(Math.floor(playheadSecs % 60)).padStart(2,'0')}`

  const CARD: React.CSSProperties = {
    background: 'white', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)', padding: 18, marginBottom: 12,
  }
  const CARD_HDR: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#111827',
    fontFamily: 'var(--font-body)', marginBottom: 14,
    display: 'flex', alignItems: 'center', gap: 7,
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ts-entry:hover .ts-time { color: var(--accent-brand) !important; background: rgba(var(--accent-brand-rgb),0.08) !important; }
      `}</style>

      <div className="page-pad" style={{ padding: '24px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>

        {/* Back + title */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/transcriptions" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9CA3AF', textDecoration: 'none', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
            <ChevronLeft size={14} /> Back to Transcriptions
          </Link>

          {editingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <input
                autoFocus
                value={tempTitle}
                onChange={e => setTempTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setTitle(tempTitle); setEditingTitle(false) }
                  if (e.key === 'Escape') setEditingTitle(false)
                }}
                style={{ fontFamily: 'var(--font-syne)', fontSize: 22, fontWeight: 700, color: '#111827', border: 'none', borderBottom: '2px solid var(--accent-brand)', outline: 'none', background: 'transparent', flex: 1, padding: '4px 0' }}
              />
              <button onClick={() => { setTitle(tempTitle); setEditingTitle(false) }} style={{ height: 34, padding: '0 14px', background: 'var(--accent-brand)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Save</button>
              <button onClick={() => setEditingTitle(false)} style={{ height: 34, padding: '0 14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0 }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>{title}</h1>
              <button
                onClick={() => { setTempTitle(title); setEditingTitle(true) }}
                title="Edit title"
                style={{ width: 28, height: 28, borderRadius: 6, background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Pencil size={13} color="#9CA3AF" />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Jul 8, 2026</span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>45:12</span>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>5,847 words</span>
            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(var(--accent-brand-rgb),0.1)', color: 'var(--accent-brand-hover)', fontFamily: 'var(--font-body)' }}>Complete</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 336px', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: audio player + transcript ── */}
          <div>
            {/* Audio player */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => jumpTo(Math.max(0, playheadSecs - 15))} style={{ width: 30, height: 30, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SkipBack size={13} color="#374151" />
                </button>
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-brand)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(var(--accent-brand-rgb),0.35)', flexShrink: 0 }}
                >
                  {isPlaying ? <Pause size={15} color="#fff" fill="#fff" /> : <Play size={15} color="#fff" fill="#fff" />}
                </button>
                <button onClick={() => jumpTo(Math.min(DURATION_SECS, playheadSecs + 15))} style={{ width: 30, height: 30, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SkipForward size={13} color="#374151" />
                </button>

                {/* Scrubber */}
                <div style={{ flex: 1, position: 'relative', cursor: 'pointer' }} onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setPlayhead(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
                }}>
                  <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: 'var(--accent-brand)', borderRadius: 2, width: `${playhead}%`, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: -5, top: -4, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-brand)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>
                  {playheadFmt} / 45:12
                </span>

                {/* Speed */}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {['0.75x', '1x', '1.25x', '1.5x'].map(s => (
                    <button key={s} onClick={() => setSpeed(s)} style={{ padding: '3px 6px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', background: speed === s ? 'var(--accent-brand)' : '#F3F4F6', color: speed === s ? '#fff' : '#6B7280', fontFamily: 'var(--font-body)' }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search within transcript..."
                style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: 36, fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: 'var(--font-body)', color: '#111827', background: 'white', boxSizing: 'border-box' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <X size={14} color="#9CA3AF" />
                </button>
              )}
            </div>
            {search && (
              <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 10, marginTop: -6 }}>
                {filteredTranscript.length} result{filteredTranscript.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
              </p>
            )}

            {/* Transcript */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '20px 24px' }}>
              {filteredTranscript.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: 14, color: '#9CA3AF', fontFamily: 'var(--font-body)', padding: '24px 0' }}>No matches for &ldquo;{search}&rdquo;</p>
              ) : filteredTranscript.map((entry, i) => {
                const color = SPEAKERS[entry.speaker] ?? '#6B7280'
                return (
                  <div key={entry.id} className="ts-entry" style={{ display: 'flex', gap: 16, marginBottom: i < filteredTranscript.length - 1 ? 22 : 0 }}>
                    <div style={{ flexShrink: 0, paddingTop: 2, width: 40 }}>
                      <button
                        className="ts-time"
                        onClick={() => jumpTo(timeToSecs(entry.time))}
                        title="Jump to this moment"
                        style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', background: '#F9FAFB', border: 'none', cursor: 'pointer', padding: '2px 5px', borderRadius: 4, transition: 'all 0.1s', whiteSpace: 'nowrap' }}
                      >
                        {entry.time}
                      </button>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff', background: color, marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                        {entry.speaker}
                      </div>
                      <p style={{ fontSize: 14, color: '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.75 }}>
                        {highlight(entry.text)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT: sidebar cards ── */}
          <div style={{ position: 'sticky', top: 80 }}>

            {/* AI Summary */}
            <div style={CARD}>
              <div style={CARD_HDR}>
                <Sparkles size={14} color="#F59E0B" /> AI Summary
                <button style={{ marginLeft: 'auto', fontSize: 11, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  Regenerate
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#4B5563', fontFamily: 'var(--font-body)', lineHeight: 1.75 }}>
                Sarah Chen is Head of Product at a B2B SaaS platform with 200+ enterprise clients experiencing 60% drop-off at the CRM connection step in onboarding. She&apos;s seeking a full UX redesign with a 4-month timeline and a $15K–$20K budget. Key solutions discussed include progressive disclosure and a guided integration wizard. The project aligns with an $18K–$22K engagement, with case studies requested by end of week.
              </p>
            </div>

            {/* Action Items */}
            <div style={CARD}>
              <div style={CARD_HDR}>
                <CheckSquare size={14} color="var(--accent-brand)" /> Action Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                {actions.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <button
                      onClick={() => toggleAction(item.id)}
                      style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.done ? 'var(--accent-brand)' : '#D1D5DB'}`, background: item.done ? 'var(--accent-brand)' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 2 }}
                    >
                      {item.done && <Check size={10} color="#fff" />}
                    </button>
                    <div>
                      <p style={{ fontSize: 12, color: item.done ? '#9CA3AF' : '#374151', fontFamily: 'var(--font-body)', lineHeight: 1.55, textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</p>
                      {item.due && !item.done && <p style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'var(--font-body)', marginTop: 2, fontWeight: 600 }}>Due {item.due}</p>}
                    </div>
                  </div>
                ))}
                {addingAction && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #D1D5DB', flexShrink: 0 }} />
                    <input
                      autoFocus
                      value={newAction}
                      onChange={e => setNewAction(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addAction(); if (e.key === 'Escape') { setAddingAction(false); setNewAction('') } }}
                      onBlur={addAction}
                      placeholder="New action item..."
                      style={{ flex: 1, height: 30, padding: '0 8px', fontSize: 12, border: '1.5px solid var(--accent-brand)', borderRadius: 6, outline: 'none', fontFamily: 'var(--font-body)', color: '#111827' }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, height: 34, background: 'var(--accent-brand)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Add to Tasks
                </button>
                <button onClick={() => setAddingAction(true)} style={{ width: 34, height: 34, background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} color="#374151" />
                </button>
              </div>
            </div>

            {/* Key Moments */}
            <div style={CARD}>
              <div style={CARD_HDR}>
                <Clock size={14} color="#8B5CF6" /> Key Moments
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {KEY_MOMENTS.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <button
                      onClick={() => jumpTo(timeToSecs(m.time))}
                      style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', border: 'none', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0, whiteSpace: 'nowrap', transition: 'background 0.1s' }}
                    >
                      {m.time}
                    </button>
                    <p style={{ fontSize: 12, color: '#4B5563', fontFamily: 'var(--font-body)', lineHeight: 1.55 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client */}
            <div style={CARD}>
              <div style={CARD_HDR}>
                <User size={14} color="#3B82F6" /> Client
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>S</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>Sarah Chen</p>
                  <Link href="/crm" style={{ fontSize: 12, color: 'var(--accent-brand)', fontFamily: 'var(--font-body)', textDecoration: 'none' }}>View CRM profile →</Link>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={CARD}>
              <div style={CARD_HDR}>
                <Tag size={14} color="#F59E0B" /> Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(var(--accent-brand-rgb),0.1)', border: '1px solid rgba(var(--accent-brand-rgb),0.2)', fontSize: 12, fontWeight: 600, color: 'var(--accent-brand-hover)', fontFamily: 'var(--font-body)' }}>
                    {t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, lineHeight: 0 }}>
                      <X size={10} color="var(--accent-brand-hover)" />
                    </button>
                  </span>
                ))}
                {addingTag ? (
                  <input
                    autoFocus
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setAddingTag(false); setNewTag('') } }}
                    onBlur={addTag}
                    placeholder="Tag name..."
                    style={{ width: 90, height: 28, padding: '0 10px', fontSize: 12, border: '1.5px solid var(--accent-brand)', borderRadius: 20, outline: 'none', fontFamily: 'var(--font-body)', color: '#111827' }}
                  />
                ) : (
                  <button onClick={() => setAddingTag(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: '#F3F4F6', border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 600, color: '#9CA3AF', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    <Plus size={10} /> Add tag
                  </button>
                )}
              </div>
            </div>

            {/* Export */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 10 }}>Export</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: <FileText size={13} color="#6B7280" />, label: 'Download Transcript (.txt)' },
                  { icon: <Download size={13} color="#6B7280" />, label: 'Download Summary (.pdf)' },
                  { icon: <Copy size={13} color="#6B7280" />, label: 'Copy to Notes' },
                  { icon: <Share2 size={13} color="#6B7280" />, label: copied ? '✓ Link copied!' : 'Share (7-day link)', action: handleShare },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 8, fontSize: 13, color: copied && btn.label.startsWith('✓') ? 'var(--accent-brand)' : '#374151', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'background 0.1s' }}
                  >
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
