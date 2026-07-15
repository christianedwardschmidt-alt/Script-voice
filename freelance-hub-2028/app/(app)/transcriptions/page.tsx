'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Mic, Upload, Eye, Download, Trash2, Square,
  Clock, User, FileText, Plus, Loader, X, Check,
} from 'lucide-react'

type Status = 'complete' | 'processing' | 'failed'
type CallType = 'Discovery' | 'Check-in' | 'Project Review' | 'Other'

interface Transcription {
  id: string
  title: string
  date: string
  duration: string
  status: Status
  client?: string
  type: CallType
  wordCount: number
  preview: string[]
}

const INITIAL: Transcription[] = [
  {
    id: '1',
    title: 'Discovery Call — Sarah Chen',
    date: 'Jul 8, 2026',
    duration: '45:12',
    status: 'complete',
    client: 'Sarah Chen',
    type: 'Discovery',
    wordCount: 5847,
    preview: [
      "Sarah: Thanks for making time today. I've been looking for a freelance designer who specializes in SaaS products for a while now...",
      "You: Of course! Tell me more about what you're working on. I saw from your brief you need help with the onboarding flow...",
      "Sarah: Yes, exactly. We have this B2B platform that's grown organically and the UX is starting to show its age. Users drop off at step 3...",
    ],
  },
  {
    id: '2',
    title: 'Project Review — Marcus Thompson',
    date: 'Jul 5, 2026',
    duration: '28:44',
    status: 'complete',
    client: 'Marcus Thompson',
    type: 'Project Review',
    wordCount: 3421,
    preview: [
      "Marcus: The dashboard mockups look great. My team reviewed them and the feedback has been very positive across the board...",
      "You: Glad they resonated. I wanted the KPI cards to be scannable at a glance without needing to open detail views...",
      "Marcus: Exactly. The one thing we're discussing is the color scheme for status indicators — red feels too harsh for warnings...",
    ],
  },
  {
    id: '3',
    title: 'Check-in — Priya Patel',
    date: 'Jul 9, 2026',
    duration: '--:--',
    status: 'processing',
    client: 'Priya Patel',
    type: 'Check-in',
    wordCount: 0,
    preview: [],
  },
  {
    id: '4',
    title: 'Contract Discussion — Jordan Williams',
    date: 'Jun 28, 2026',
    duration: '52:03',
    status: 'complete',
    client: 'Jordan Williams',
    type: 'Other',
    wordCount: 7218,
    preview: [
      "Jordan: The scope has expanded. The client is now asking for mobile app coverage in addition to the web platform...",
      "You: For mobile we'd need roughly 40 hours added to the original estimate. It depends on how much the designs overlap...",
      "Jordan: Let's talk timeline first, then work backwards to pricing so we can present it cleanly to the client tomorrow...",
    ],
  },
]

const S_CFG = {
  complete:   { label: 'Complete',   bg: 'rgba(var(--accent-brand-rgb),0.1)',   color: 'var(--accent-brand-hover)' },
  processing: { label: 'Processing', bg: 'rgba(245,158,11,0.1)',  color: '#B45309' },
  failed:     { label: 'Failed',     bg: 'rgba(239,68,68,0.1)',   color: '#DC2626' },
} as const

const CALL_TYPES: CallType[] = ['Discovery', 'Check-in', 'Project Review', 'Other']
const SAMPLE_CLIENTS = ['Sarah Chen', 'Marcus Thompson', 'Priya Patel', 'Jordan Williams', 'Alex Rivera']

const FIELD: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', fontSize: 14,
  border: '1.5px solid #E5E7EB', borderRadius: 8, outline: 'none',
  fontFamily: 'var(--font-body)', color: '#111827', background: 'white',
  boxSizing: 'border-box',
}

export default function TranscriptionsPage() {
  const [list, setList] = useState<Transcription[]>(INITIAL)
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [showRecord, setShowRecord] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [recordState, setRecordState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [timer, setTimer] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [rTitle, setRTitle] = useState('')
  const [rClient, setRClient] = useState('')
  const [rType, setRType] = useState<CallType>('Discovery')
  const [uTitle, setUTitle] = useState('')
  const [uClient, setUClient] = useState('')
  const [uType, setUType] = useState<CallType>('Discovery')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadIv = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (recordState !== 'recording') return
    const iv = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [recordState])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setShowRecord(false)
      setShowUpload(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const todayStr = () =>
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  function startRecording() { setTimer(0); setRecordState('recording') }

  function stopRecording() {
    setRecordState('processing')
    setTimeout(() => {
      const id = Date.now().toString()
      setList(prev => [{
        id, title: rTitle || `Call — ${todayStr()}`, date: todayStr(),
        duration: fmt(timer), status: 'processing' as Status,
        client: rClient || undefined, type: rType, wordCount: 0, preview: [],
      }, ...prev])
      setShowRecord(false); setRecordState('idle'); setTimer(0)
      setRTitle(''); setRClient(''); setRType('Discovery')
    }, 2500)
  }

  function closeRecord() {
    setShowRecord(false); setRecordState('idle'); setTimer(0)
    setRTitle(''); setRClient(''); setRType('Discovery')
  }

  function handleUpload() {
    if (!uploadFile || uploading) return
    setUploading(true); setUploadProgress(0)
    uploadIv.current = setInterval(() => {
      setUploadProgress(p => {
        const next = p + Math.random() * 12 + 4
        if (next >= 100) {
          clearInterval(uploadIv.current!)
          const id = Date.now().toString()
          setList(prev => [{
            id, title: uTitle || uploadFile.name.replace(/\.[^.]+$/, ''), date: todayStr(),
            duration: '--:--', status: 'processing' as Status,
            client: uClient || undefined, type: uType, wordCount: 0, preview: [],
          }, ...prev])
          setShowUpload(false); setUploading(false); setUploadFile(null)
          setUploadProgress(0); setUTitle(''); setUClient(''); setUType('Discovery')
          return 0
        }
        return next
      })
    }, 180)
  }

  function del(id: string) { setList(prev => prev.filter(t => t.id !== id)) }

  const filtered = filter === 'all' ? list : list.filter(t => t.status === filter)
  const counts = {
    all: list.length,
    complete: list.filter(t => t.status === 'complete').length,
    processing: list.filter(t => t.status === 'processing').length,
    failed: list.filter(t => t.status === 'failed').length,
  }

  const OVERLAY: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)', padding: '0 16px',
  }
  const MODAL: React.CSSProperties = {
    background: 'white', borderRadius: 20,
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
    width: '100%', maxWidth: 480, padding: 32,
    animation: 'fadeIn 0.15s ease-out',
    maxHeight: '90vh', overflowY: 'auto',
  }
  const LABEL: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6, fontFamily: 'var(--font-body)',
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes wave1 { 0%, 100% { height: 6px; } 50% { height: 28px; } }
        @keyframes wave2 { 0%, 100% { height: 10px; } 50% { height: 20px; } }
        @keyframes wave3 { 0%, 100% { height: 4px; } 50% { height: 32px; } }
        @keyframes wave4 { 0%, 100% { height: 8px; } 50% { height: 24px; } }
        @keyframes wave5 { 0%, 100% { height: 6px; } 50% { height: 16px; } }
        @keyframes recPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 4px 20px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(239,68,68,0), 0 4px 20px rgba(239,68,68,0.3); }
        }
        @keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-pad" style={{ padding: '28px 32px', background: 'var(--bg)', minHeight: '100dvh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Transcriptions</h1>
            <p style={{ fontFamily: 'var(--font-body)', color: '#6B7280', fontSize: 15, marginTop: 4 }}>Record calls, upload audio, and get instant AI summaries with action items.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowUpload(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              <Upload size={15} color="#6B7280" /> Upload File
            </button>
            <button
              onClick={() => setShowRecord(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', background: 'var(--accent-brand)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(var(--accent-brand-rgb),0.3)' }}
            >
              <Mic size={15} color="#fff" /> Record Call
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', 'complete', 'processing', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                border: filter === f ? '1.5px solid var(--accent-brand)' : '1.5px solid #E5E7EB',
                background: filter === f ? 'rgba(var(--accent-brand-rgb),0.08)' : 'white',
                color: filter === f ? 'var(--accent-brand-hover)' : '#6B7280',
              }}
            >
              {f === 'all' ? 'All' : S_CFG[f as Status].label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: 9, fontSize: 11, fontWeight: 700,
                background: filter === f ? 'var(--accent-brand)' : '#F3F4F6',
                color: filter === f ? '#fff' : '#6B7280',
              }}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 0', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(107,114,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Mic size={36} color="rgba(107,114,128,0.35)" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 6 }}>No transcriptions yet</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 24, maxWidth: 320 }}>Record your first call or upload an audio file to get started.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRecord(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'var(--accent-brand)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Mic size={15} /> Record Call
              </button>
              <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Upload size={15} /> Upload File
              </button>
            </div>
          </div>
        ) : (
          <div>
            {filtered.map(t => {
              const sc = S_CFG[t.status]
              const isHov = hovered === t.id
              return (
                <div
                  key={t.id}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: 'white', borderRadius: 'var(--radius-lg)',
                    boxShadow: isHov ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    padding: 24, marginBottom: 12, transition: 'box-shadow 0.2s',
                  }}
                >
                  {/* Card header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: t.preview.length > 0 ? 14 : 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {t.duration !== '--:--' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
                            <Clock size={11} color="#9CA3AF" /> {t.duration}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, fontFamily: 'var(--font-body)' }}>
                          {t.status === 'processing' && (
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'dotPulse 1.2s ease-in-out infinite' }} />
                          )}
                          {sc.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{t.date}</span>
                      </div>
                    </div>
                    {/* Hover actions */}
                    <div style={{ display: 'flex', gap: 4, opacity: isHov ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                      {t.status === 'complete' && (
                        <Link href={`/transcriptions/${t.id}`} title="View transcript"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6', textDecoration: 'none' }}>
                          <Eye size={14} color="#6B7280" />
                        </Link>
                      )}
                      <button title="Download" onClick={() => {}} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6', cursor: 'pointer' }}>
                        <Download size={14} color="#6B7280" />
                      </button>
                      <button title="Delete" onClick={() => del(t.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer' }}>
                        <Trash2 size={14} color="#EF4444" />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {t.preview.length > 0 && (
                    <div style={{ borderTop: '1px solid #F9FAFB', borderBottom: '1px solid #F9FAFB', padding: '14px 0', marginBottom: 12 }}>
                      {t.preview.map((line, i) => (
                        <p key={i} style={{ fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-body)', lineHeight: 1.65, marginBottom: i < t.preview.length - 1 ? 4 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {t.client && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 12, fontWeight: 600, color: '#2563EB', fontFamily: 'var(--font-body)' }}>
                          <User size={10} color="#3B82F6" /> {t.client}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                        <FileText size={11} color="#D1D5DB" />
                        {t.wordCount > 0 ? `${t.wordCount.toLocaleString()} words` : 'Transcribing...'}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: '#F3F4F6', fontSize: 11, fontWeight: 600, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{t.type}</span>
                    </div>
                    {t.status === 'complete' && (
                      <Link href={`/transcriptions/${t.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-brand)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
                        View transcript →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Record Modal ─────────────────────────────────── */}
      {showRecord && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) closeRecord() }}>
          <div style={MODAL}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827' }}>Record a Call</h2>
              <button onClick={closeRecord} style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#6B7280" />
              </button>
            </div>

            {recordState === 'idle' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                  <div>
                    <label style={LABEL}>Call title</label>
                    <input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder={`Call — ${todayStr()}`} style={FIELD} />
                  </div>
                  <div>
                    <label style={LABEL}>Link to client</label>
                    <select value={rClient} onChange={e => setRClient(e.target.value)} style={{ ...FIELD, cursor: 'pointer', appearance: 'none' }}>
                      <option value="">No client linked</option>
                      {SAMPLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Call type</label>
                    <select value={rType} onChange={e => setRType(e.target.value as CallType)} style={{ ...FIELD, cursor: 'pointer', appearance: 'none' }}>
                      {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <button
                    onClick={startRecording}
                    style={{ width: 80, height: 80, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
                  >
                    <Mic size={32} color="#fff" />
                  </button>
                  <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', fontFamily: 'var(--font-body)' }}>GuildWire will record and transcribe your call in real time</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontFamily: 'var(--font-body)' }}>Make sure your browser allows microphone access</p>
                </div>
              </>
            )}

            {recordState === 'recording' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'dotPulse 1s ease-in-out infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', fontFamily: 'var(--font-body)' }}>Recording</span>
                </div>
                <div style={{ fontSize: 52, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt(timer)}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: 5, borderRadius: 3, background: 'var(--accent-brand)', animation: `wave${i} ${0.7 + i * 0.12}s ease-in-out infinite`, animationDelay: `${(i - 1) * 0.1}s` }} />
                  ))}
                </div>
                <button
                  onClick={stopRecording}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  <Square size={13} color="#fff" fill="#fff" /> Stop Recording
                </button>
              </div>
            )}

            {recordState === 'processing' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0' }}>
                <Loader size={40} color="var(--accent-brand)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)' }}>Processing your transcription...</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>This usually takes 1–2 minutes. You&apos;ll be notified when it&apos;s ready.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────── */}
      {showUpload && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget && !uploading) setShowUpload(false) }}>
          <div style={MODAL}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 700, color: '#111827' }}>Upload Audio or Video</h2>
              {!uploading && (
                <button onClick={() => setShowUpload(false)} style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#6B7280" />
                </button>
              )}
            </div>

            {!uploading ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f) }}
                  onClick={() => !uploadFile && fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent-brand)' : uploadFile ? 'var(--accent-brand)' : 'rgba(var(--accent-brand-rgb),0.3)'}`,
                    background: dragOver ? 'rgba(var(--accent-brand-rgb),0.06)' : uploadFile ? 'rgba(var(--accent-brand-rgb),0.03)' : 'rgba(var(--accent-brand-rgb),0.02)',
                    borderRadius: 12, padding: '40px 24px', textAlign: 'center',
                    cursor: uploadFile ? 'default' : 'pointer', marginBottom: 20,
                    transition: 'all 0.15s',
                  }}
                >
                  {uploadFile ? (
                    <>
                      <FileText size={28} color="var(--accent-brand)" style={{ marginBottom: 10 }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{uploadFile.name}</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
                        {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      <button onClick={e => { e.stopPropagation(); setUploadFile(null) }} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={28} color="#9CA3AF" style={{ marginBottom: 10 }} />
                      <p style={{ fontSize: 14, color: '#374151', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                        Drop your file here or <span style={{ color: 'var(--accent-brand)', fontWeight: 600 }}>click to browse</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>Supports MP3, MP4, M4A, WAV, WebM — up to 500MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef} type="file"
                  accept=".mp3,.mp4,.m4a,.wav,.webm,audio/*,video/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setUploadFile(f) }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  <div>
                    <label style={LABEL}>Title <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
                    <input value={uTitle} onChange={e => setUTitle(e.target.value)} placeholder="Enter a title for this transcription" style={FIELD} />
                  </div>
                  <div>
                    <label style={LABEL}>Link to client</label>
                    <select value={uClient} onChange={e => setUClient(e.target.value)} style={{ ...FIELD, cursor: 'pointer', appearance: 'none' }}>
                      <option value="">No client linked</option>
                      {SAMPLE_CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Call type</label>
                    <select value={uType} onChange={e => setUType(e.target.value as CallType)} style={{ ...FIELD, cursor: 'pointer', appearance: 'none' }}>
                      {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  style={{
                    width: '100%', height: 44,
                    background: uploadFile ? 'var(--accent-brand)' : '#E5E7EB',
                    color: uploadFile ? '#fff' : '#9CA3AF',
                    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                    cursor: uploadFile ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-body)',
                    boxShadow: uploadFile ? '0 2px 8px rgba(var(--accent-brand-rgb),0.3)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  Upload and Transcribe
                </button>
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{uploadFile?.name}</p>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-brand)', fontFamily: 'var(--font-body)', marginLeft: 12 }}>{Math.round(uploadProgress)}%</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-brand), #22C55E)', borderRadius: 4, width: `${uploadProgress}%`, transition: 'width 0.2s ease' }} />
                </div>
                <p style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)', marginTop: 10 }}>Transcription begins automatically after upload.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
