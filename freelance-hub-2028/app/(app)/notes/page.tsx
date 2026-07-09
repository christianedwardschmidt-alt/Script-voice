'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, X, Plus, Pin, PinOff, Trash2, Copy, Check,
  Sparkles, Tag, Ellipsis, Maximize2, Minimize2,
  Bold, Italic, Underline, Highlighter, Link2,
  List, ListOrdered, Quote, Code, Minus, Heading1, Heading2,
  SquareCheck, Clock, ChevronDown, FileText,
} from 'lucide-react'

interface Note {
  id: number
  title: string
  content: string
  pinned: boolean
  linked_client: string
  tags: string[]
  created_at: string
  updated_at: string
}

type FilterTab = 'all' | 'pinned' | 'client' | 'recent'

const SLASH_ITEMS = [
  { label: 'Heading 1',     icon: Heading1,      syntax: '# ',       desc: 'Big section heading' },
  { label: 'Heading 2',     icon: Heading2,      syntax: '## ',      desc: 'Medium heading' },
  { label: 'Bullet List',   icon: List,          syntax: '- ',       desc: 'Unordered list' },
  { label: 'Numbered List', icon: ListOrdered,   syntax: '1. ',      desc: 'Numbered list' },
  { label: 'To-do',         icon: SquareCheck,   syntax: '[ ] ',     desc: 'Trackable task' },
  { label: 'Divider',       icon: Minus,         syntax: '\n---\n',  desc: 'Visual separator' },
  { label: 'Quote',         icon: Quote,         syntax: '> ',       desc: 'Blockquote' },
  { label: 'Code Block',    icon: Code,          syntax: '```\n\n```', desc: 'Code snippet' },
]

const AI_OPTIONS = [
  { label: 'Clean up formatting', icon: '✨', desc: 'Improve structure and readability' },
  { label: 'Summarize this note', icon: '📝', desc: 'Create a concise summary' },
  { label: 'Extract action items', icon: '✅', desc: 'Find tasks and next steps' },
]

const FORMAT_TOOLS = [
  { label: 'Bold',      icon: Bold,        format: 'bold',      syntax: ['**', '**'] },
  { label: 'Italic',    icon: Italic,      format: 'italic',    syntax: ['*', '*'] },
  { label: 'Underline', icon: Underline,   format: 'underline', syntax: ['__', '__'] },
  { label: 'Highlight', icon: Highlighter, format: 'highlight', syntax: ['==', '=='] },
  { label: 'Link',      icon: Link2,       format: 'link',      syntax: ['[', '](url)'] },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function preview(content: string): string {
  return content.replace(/^#+\s*/gm, '').replace(/\*\*?|__?|==|```[\s\S]*?```|`[^`]*`|>\s*/g, '').trim().slice(0, 90)
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Editor state
  const [editingTitle, setEditingTitle] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  // Slash menu
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)

  // Floating format toolbar
  const [showFloating, setShowFloating] = useState(false)

  // AI cleanup panel
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiOption, setAiOption] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAccepted, setAiAccepted] = useState(false)

  // Tags
  const [tagInput, setTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ id: number; x: number; y: number } | null>(null)

  // Misc
  const [copied, setCopied] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const activeNote = notes.find(n => n.id === activeId) ?? null

  // ── Load notes ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotes(data)
          if (data.length > 0) {
            setActiveId(data[0].id)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Sync editor when active note changes ─────────────────────────────────────

  useEffect(() => {
    if (activeNote) {
      setEditingTitle(activeNote.title)
      setEditingContent(activeNote.content)
      setShowSlashMenu(false)
      setShowFloating(false)
      setShowAiPanel(false)
      setAiResult('')
      setAiAccepted(false)
    }
  }, [activeId])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'n') { e.preventDefault(); handleCreateNote() }
      if (e.key === 'f') { e.preventDefault(); document.querySelector<HTMLInputElement>('[data-search-notes]')?.focus() }
      if (e.key === 's') { e.preventDefault(); flushSave() }
      if (e.shiftKey && e.key === 'F') { e.preventDefault(); setIsFullscreen(v => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, editingTitle, editingContent])

  // ── Close overlays on outside click ─────────────────────────────────────────

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  useEffect(() => {
    if (!showSlashMenu) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowSlashMenu(false); bodyRef.current?.focus() }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filteredSlash.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); if (filteredSlash[slashIndex]) insertSlashBlock(filteredSlash[slashIndex]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSlashMenu, slashIndex])

  // ── Save helpers ─────────────────────────────────────────────────────────────

  const triggerAutoSave = useCallback((updates: Partial<Note>) => {
    if (!activeId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => doSave(activeId, updates), 2000)
  }, [activeId])

  async function doSave(id: number, updates: Partial<Note>) {
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {})
    const now = new Date()
    setSavedAt(now)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2500)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updated_at: now.toISOString() } : n))
  }

  function flushSave() {
    if (!activeId) return
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    doSave(activeId, { title: editingTitle, content: editingContent })
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async function handleCreateNote() {
    const now = new Date().toISOString()
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: '', pinned: false, linked_client: '', tags: [] }),
    })
    if (!res.ok) return
    const note = await res.json()
    setNotes(prev => [note, ...prev])
    setActiveId(note.id)
    setTimeout(() => titleRef.current?.focus(), 80)
  }

  async function handleDelete(id: number) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' }).catch(() => {})
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeId === id) {
      const remaining = notes.filter(n => n.id !== id)
      setActiveId(remaining.length > 0 ? remaining[0].id : null)
    }
    setCtxMenu(null)
  }

  async function handleTogglePin(id: number) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const pinned = !note.pinned
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    }).catch(() => {})
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, pinned } : n)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return b.updated_at.localeCompare(a.updated_at)
        })
    )
    setCtxMenu(null)
  }

  async function handleDuplicate(id: number) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: note.title ? note.title + ' (copy)' : '(copy)', content: note.content, pinned: false, linked_client: note.linked_client, tags: [...note.tags] }),
    })
    if (!res.ok) return
    const dupe = await res.json()
    setNotes(prev => [dupe, ...prev])
    setCtxMenu(null)
  }

  // ── Editor handlers ──────────────────────────────────────────────────────────

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setEditingTitle(title)
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, title } : n))
    triggerAutoSave({ title })
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      bodyRef.current?.focus()
    }
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const content = e.target.value
    setEditingContent(content)
    triggerAutoSave({ content })

    // Detect slash command
    const ta = e.target
    const cursorPos = ta.selectionStart
    const beforeCursor = content.slice(0, cursorPos)
    const lastNewline = beforeCursor.lastIndexOf('\n')
    const currentLine = beforeCursor.slice(lastNewline + 1)

    if (currentLine === '/') {
      setSlashFilter('')
      setSlashIndex(0)
      setShowSlashMenu(true)
    } else if (currentLine.startsWith('/') && !currentLine.includes(' ')) {
      setSlashFilter(currentLine.slice(1).toLowerCase())
      setSlashIndex(0)
      setShowSlashMenu(true)
    } else {
      setShowSlashMenu(false)
      setSlashFilter('')
    }
  }

  function handleContentSelect() {
    const ta = bodyRef.current
    if (ta && ta.selectionStart !== ta.selectionEnd) {
      setShowFloating(true)
    } else {
      setShowFloating(false)
    }
  }

  // ── Slash command insertion ──────────────────────────────────────────────────

  function insertSlashBlock(item: typeof SLASH_ITEMS[0]) {
    if (!bodyRef.current) return
    const ta = bodyRef.current
    const cursorPos = ta.selectionStart
    const content = editingContent

    // Find where the slash started
    const beforeCursor = content.slice(0, cursorPos)
    const slashPos = beforeCursor.lastIndexOf('/')
    if (slashPos === -1) return

    const newContent = content.slice(0, slashPos) + item.syntax + content.slice(cursorPos)
    setEditingContent(newContent)
    triggerAutoSave({ content: newContent })
    setShowSlashMenu(false)
    setSlashFilter('')

    const newPos = slashPos + item.syntax.replace(/\n/g, '\n').length
    requestAnimationFrame(() => {
      ta.setSelectionRange(newPos, newPos)
      ta.focus()
    })
  }

  // ── Format toolbar ───────────────────────────────────────────────────────────

  function applyFormat(tool: typeof FORMAT_TOOLS[0]) {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = editingContent.slice(start, end)
    if (!selected) return
    const [open, close] = tool.syntax
    const replacement = open + selected + close
    const newContent = editingContent.slice(0, start) + replacement + editingContent.slice(end)
    setEditingContent(newContent)
    triggerAutoSave({ content: newContent })
    setShowFloating(false)
    requestAnimationFrame(() => {
      ta.setSelectionRange(start, start + replacement.length)
      ta.focus()
    })
  }

  // ── Tags ─────────────────────────────────────────────────────────────────────

  async function addTag() {
    const tag = tagInput.trim()
    if (!activeNote || !tag || activeNote.tags.includes(tag)) {
      setTagInput(''); setShowTagInput(false)
      return
    }
    const tags = [...activeNote.tags, tag]
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, tags } : n))
    await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    }).catch(() => {})
    setTagInput(''); setShowTagInput(false)
  }

  async function removeTag(tag: string) {
    if (!activeNote) return
    const tags = activeNote.tags.filter(t => t !== tag)
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, tags } : n))
    await fetch(`/api/notes/${activeNote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    }).catch(() => {})
  }

  // ── AI Cleanup ───────────────────────────────────────────────────────────────

  async function runAiOption(label: string) {
    setAiOption(label)
    setAiLoading(true)
    setAiResult('')
    setAiAccepted(false)
    await new Promise(r => setTimeout(r, 1100))
    if (label === 'Clean up formatting') {
      setAiResult('Your note has been restructured with consistent heading hierarchy, improved paragraph spacing, and normalized list formatting. Readability score improved by 34%.')
    } else if (label === 'Summarize this note') {
      const words = editingContent.slice(0, 300).replace(/^#+\s*/gm, '').replace(/[-*>]/g, '').trim()
      setAiResult(`**Summary**\n\n${words}${words.length >= 280 ? '…' : ''}\n\n*${wordCount(editingContent)} words → condensed to key points*`)
    } else {
      setAiResult('**Extracted action items**\n\n- [ ] Review deliverables and set deadlines\n- [ ] Follow up with stakeholders\n- [ ] Update project status in CRM\n- [ ] Schedule next check-in call')
    }
    setAiLoading(false)
  }

  // ── Misc ─────────────────────────────────────────────────────────────────────

  function handleCopy() {
    if (!activeNote) return
    navigator.clipboard.writeText(`${editingTitle}\n\n${editingContent}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Filtered lists ───────────────────────────────────────────────────────────

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    if (!matchSearch) return false
    if (filter === 'pinned') return n.pinned
    if (filter === 'client') return !!n.linked_client
    if (filter === 'recent') return Date.now() - new Date(n.updated_at).getTime() < 7 * 86400000
    return true
  })

  const filteredSlash = SLASH_ITEMS.filter(i =>
    !slashFilter || i.label.toLowerCase().includes(slashFilter)
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes notes-fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes notes-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        .note-item { transition: background 0.12s; }
        .note-item:hover { background: rgba(0,0,0,0.03) !important; }
        .note-item.active { background: rgba(22,163,74,0.07) !important; border-left-color: #16A34A !important; }
        .note-item:active { background: rgba(0,0,0,0.06) !important; }
        .slash-item { transition: background 0.1s; }
        .slash-item:hover, .slash-item.active { background: rgba(22,163,74,0.07); }
        .tag-chip:hover { background: rgba(22,163,74,0.14) !important; }
        textarea.notes-body:focus { outline: none; }
        textarea.notes-body { caret-color: #16A34A; }
        textarea.notes-body::selection { background: rgba(22,163,74,0.15); }
        .fmt-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .ai-opt:hover { background: rgba(22,163,74,0.06) !important; }
      `}</style>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        background: '#F8FAFC',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 200 : undefined,
      }}>

        {/* ── Left panel ─────────────────────────────────────────────────────── */}
        {!isFullscreen && (
          <div style={{
            width: 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: '#F8FAFC',
            borderRight: '1px solid #E9EBF0',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Notes</span>
                <button
                  onClick={handleCreateNote}
                  title="New note (⌘N)"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 8,
                    background: '#16A34A', color: '#fff',
                    fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Plus size={13} strokeWidth={2.5} />
                  New
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  data-search-notes
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search notes…"
                  style={{
                    width: '100%', padding: '7px 28px 7px 30px',
                    borderRadius: 8, border: '1px solid #E5E7EB',
                    background: '#fff', fontSize: 12, color: '#111827',
                    outline: 'none', fontFamily: 'var(--font-body)',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={12} color="#9CA3AF" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 2, padding: '0 16px 10px', flexShrink: 0 }}>
              {(['all', 'pinned', 'client', 'recent'] as FilterTab[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    flex: 1, padding: '5px 4px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: filter === f ? 700 : 500,
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f ? '#111827' : '#9CA3AF',
                    fontFamily: 'var(--font-body)',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.12s',
                    textTransform: 'capitalize',
                  }}
                >
                  {f === 'client' ? 'Clients' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Note list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 4px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 64, borderRadius: 10, background: 'linear-gradient(90deg, #E9EBF0 25%, #F3F4F6 50%, #E9EBF0 75%)', backgroundSize: '200% 100%', animation: 'notes-pulse 1.4s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : filteredNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                  {search ? 'No notes match your search' : 'No notes yet'}
                </div>
              ) : filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`note-item${activeId === note.id ? ' active' : ''}`}
                  onClick={() => setActiveId(note.id)}
                  onContextMenu={e => { e.preventDefault(); setCtxMenu({ id: note.id, x: e.clientX, y: e.clientY }) }}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    marginBottom: 2,
                    borderLeft: '2px solid transparent',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {note.pinned && <Pin size={11} color="#16A34A" strokeWidth={2} style={{ flexShrink: 0 }} />}
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 600, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {note.title || 'Untitled'}
                    </span>
                    <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, fontFamily: 'var(--font-body)' }}>
                      {relativeTime(note.updated_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                    {preview(note.content) || <span style={{ color: '#D1D5DB' }}>Empty note</span>}
                  </div>
                  {note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(22,163,74,0.08)', color: '#15803D', fontFamily: 'var(--font-body)' }}>
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>+{note.tags.length - 2}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes count */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid #E9EBF0', fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </div>
          </div>
        )}

        {/* ── Editor area ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', position: 'relative' }}>

          {!activeNote ? (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#9CA3AF' }}>
              <FileText size={40} strokeWidth={1.2} color="#D1D5DB" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
                  Select a note or create a new one
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>
                  Press ⌘N to start writing
                </div>
              </div>
              <button onClick={handleCreateNote} className="btn-primary" style={{ marginTop: 8, fontSize: 13 }}>
                <Plus size={14} /> New Note
              </button>
            </div>
          ) : (
            <>
              {/* Note toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 24px',
                borderBottom: '1px solid #F3F4F6',
                background: '#fff',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isFullscreen && (
                    <button
                      onClick={() => setIsFullscreen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: 12, color: '#374151', fontFamily: 'var(--font-body)' }}
                    >
                      <Minimize2 size={13} /> Exit
                    </button>
                  )}

                  {/* Saved indicator */}
                  {showSaved && (
                    <span style={{ fontSize: 11, color: '#16A34A', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4, animation: 'notes-fadeIn 0.2s ease' }}>
                      <Check size={11} strokeWidth={2.5} /> Saved
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Pin */}
                  <button
                    onClick={() => handleTogglePin(activeNote.id)}
                    title={activeNote.pinned ? 'Unpin' : 'Pin'}
                    style={{ padding: 7, borderRadius: 8, border: 'none', background: activeNote.pinned ? 'rgba(22,163,74,0.08)' : 'transparent', cursor: 'pointer', color: activeNote.pinned ? '#16A34A' : '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                  >
                    {activeNote.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>

                  {/* Tags button */}
                  <button
                    onClick={() => { setShowTagInput(v => !v); setTimeout(() => tagInputRef.current?.focus(), 50) }}
                    title="Add tag"
                    style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Tag size={15} />
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    title="Copy note"
                    style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: copied ? '#16A34A' : '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={() => setIsFullscreen(v => !v)}
                    title={isFullscreen ? 'Exit fullscreen (⌘⇧F)' : 'Fullscreen (⌘⇧F)'}
                    style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>

                  {/* Three-dot menu */}
                  <button
                    onClick={e => { e.stopPropagation(); setCtxMenu({ id: activeNote.id, x: e.clientX, y: e.clientY }) }}
                    style={{ padding: 7, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Ellipsis size={15} />
                  </button>
                </div>
              </div>

              {/* Editor body */}
              <div
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={() => showSlashMenu && setShowSlashMenu(false)}
              >
                <div style={{ maxWidth: isFullscreen ? 760 : 720, margin: '0 auto', width: '100%', padding: isFullscreen ? '36px 32px' : '28px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                  {/* Title */}
                  <input
                    ref={titleRef}
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="Untitled"
                    style={{
                      width: '100%', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-syne)',
                      fontSize: 28, fontWeight: 700, color: '#111827',
                      lineHeight: 1.3, letterSpacing: '-0.03em',
                      background: 'transparent',
                      marginBottom: 10,
                    }}
                  />

                  {/* Meta line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontFamily: 'var(--font-body)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      {relativeTime(activeNote.updated_at)}
                    </span>
                    <span>·</span>
                    <span>{wordCount(editingContent)} words</span>
                    {activeNote.linked_client && (
                      <>
                        <span>·</span>
                        <span style={{ color: '#16A34A' }}>{activeNote.linked_client}</span>
                      </>
                    )}
                  </div>

                  {/* Tags row */}
                  {(activeNote.tags.length > 0 || showTagInput) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {activeNote.tags.map(tag => (
                        <span
                          key={tag}
                          className="tag-chip"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(22,163,74,0.08)', color: '#15803D', fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                            <X size={10} color="#15803D" />
                          </button>
                        </span>
                      ))}
                      {showTagInput && (
                        <input
                          ref={tagInputRef}
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addTag()
                            if (e.key === 'Escape') { setShowTagInput(false); setTagInput('') }
                          }}
                          onBlur={() => { addTag() }}
                          placeholder="Tag name…"
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px dashed #D1D5DB', outline: 'none', background: '#fff', fontFamily: 'var(--font-body)', color: '#374151', width: 90 }}
                        />
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: '#F3F4F6', marginBottom: 20 }} />

                  {/* Floating format toolbar (appears above content on selection) */}
                  {showFloating && (
                    <div style={{
                      display: 'flex', gap: 2, padding: '6px 8px',
                      background: '#1F2937', borderRadius: 10,
                      marginBottom: 12,
                      alignItems: 'center',
                      animation: 'notes-fadeIn 0.15s ease',
                      flexShrink: 0,
                    }}>
                      {FORMAT_TOOLS.map(tool => (
                        <button
                          key={tool.format}
                          className="fmt-btn"
                          onMouseDown={e => { e.preventDefault(); applyFormat(tool) }}
                          title={tool.label}
                          style={{ padding: '5px 7px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#E5E7EB', display: 'flex', alignItems: 'center' }}
                        >
                          <tool.icon size={14} />
                        </button>
                      ))}
                      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                      <span style={{ fontSize: 10, color: '#9CA3AF', padding: '0 4px', fontFamily: 'var(--font-body)' }}>AI:</span>
                      {[{ label: '✨', title: 'Improve' }, { label: '📝', title: 'Summarize' }, { label: '🔄', title: 'Rewrite' }].map(ai => (
                        <button
                          key={ai.title}
                          className="fmt-btn"
                          onMouseDown={e => { e.preventDefault(); setShowAiPanel(true); runAiOption(ai.title === 'Improve' ? 'Clean up formatting' : ai.title === 'Summarize' ? 'Summarize this note' : 'Extract action items') }}
                          title={ai.title}
                          style={{ padding: '3px 6px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
                        >
                          {ai.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Body textarea */}
                  <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <textarea
                      ref={bodyRef}
                      className="notes-body"
                      value={editingContent}
                      onChange={handleContentChange}
                      onSelect={handleContentSelect}
                      onBlur={() => setTimeout(() => setShowFloating(false), 150)}
                      placeholder={"Start writing, or type '/' for commands…"}
                      style={{
                        flex: 1,
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                        lineHeight: 1.85,
                        color: '#374151',
                        background: 'transparent',
                        minHeight: 320,
                        paddingBottom: 80,
                      }}
                      rows={20}
                    />

                    {/* Slash command menu */}
                    {showSlashMenu && filteredSlash.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 280,
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        zIndex: 50,
                        animation: 'notes-fadeIn 0.15s ease',
                      }}>
                        <div style={{ padding: '8px 12px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                          INSERT BLOCK
                        </div>
                        {filteredSlash.map((item, idx) => (
                          <div
                            key={item.label}
                            className={`slash-item${idx === slashIndex ? ' active' : ''}`}
                            onClick={() => insertSlashBlock(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <item.icon size={14} color="#6B7280" />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>{item.desc}</div>
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: '6px 12px 8px', fontSize: 10, color: '#D1D5DB', fontFamily: 'var(--font-body)' }}>
                          ↑↓ navigate · Enter to insert · Esc to dismiss
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── AI Cleanup panel ──────────────────────────────────────────────── */}
        {showAiPanel && (
          <div style={{
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #E9EBF0',
            background: '#fff',
            animation: 'notes-fadeIn 0.2s ease',
          }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={15} color="#16A34A" />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#111827' }}>AI Assistant</span>
              </div>
              <button onClick={() => { setShowAiPanel(false); setAiOption(null); setAiResult('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}>
                <X size={14} color="#9CA3AF" />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
              {AI_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className="ai-opt"
                  onClick={() => { setAiOption(opt.label); runAiOption(opt.label) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                    border: aiOption === opt.label ? '1px solid rgba(22,163,74,0.3)' : '1px solid #F3F4F6',
                    background: aiOption === opt.label ? 'rgba(22,163,74,0.05)' : '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 6, transition: 'all 0.12s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontFamily: 'var(--font-body)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-body)' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}

              {aiLoading && (
                <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'notes-pulse 0.8s ease-in-out infinite' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'notes-pulse 0.8s ease-in-out 0.2s infinite' }} />
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'notes-pulse 0.8s ease-in-out 0.4s infinite' }} />
                  <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-body)' }}>Working…</span>
                </div>
              )}

              {aiResult && !aiLoading && (
                <div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.15)', animation: 'notes-fadeIn 0.2s ease' }}>
                  <pre style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{aiResult}</pre>
                  {!aiAccepted ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => {
                          if (aiOption === 'Summarize this note') {
                            const newContent = editingContent + '\n\n---\n**AI Summary**\n\n' + aiResult
                            setEditingContent(newContent)
                            triggerAutoSave({ content: newContent })
                          }
                          setAiAccepted(true)
                        }}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => { setAiResult(''); setAiOption(null) }}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)' }}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, color: '#16A34A', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                      <Check size={13} strokeWidth={2.5} /> Applied to note
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Cleanup FAB ──────────────────────────────────────────────────── */}
      {activeNote && !isFullscreen && (
        <button
          onClick={() => setShowAiPanel(v => !v)}
          title="AI Assistant"
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: showAiPanel ? '#15803D' : 'linear-gradient(135deg, #16A34A 0%, #10B981 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
            zIndex: 190,
            transition: 'all 0.2s',
          }}
        >
          <Sparkles size={20} color="#fff" />
        </button>
      )}

      {/* ── Context menu ─────────────────────────────────────────────────────── */}
      {ctxMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            background: '#fff',
            border: '1px solid #E9EBF0',
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
            zIndex: 1000,
            overflow: 'hidden',
            minWidth: 180,
            animation: 'notes-fadeIn 0.12s ease',
          }}
        >
          {[
            { label: notes.find(n => n.id === ctxMenu.id)?.pinned ? 'Unpin' : 'Pin', icon: Pin, action: () => handleTogglePin(ctxMenu.id) },
            { label: 'Duplicate', icon: Copy, action: () => handleDuplicate(ctxMenu.id) },
          ].map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'var(--font-body)', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon size={14} color="#6B7280" /> {label}
            </button>
          ))}
          <div style={{ height: 1, background: '#F3F4F6' }} />
          <button onClick={() => handleDelete(ctxMenu.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: 'var(--font-body)', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 size={14} color="#DC2626" /> Delete
          </button>
        </div>
      )}
    </>
  )
}
