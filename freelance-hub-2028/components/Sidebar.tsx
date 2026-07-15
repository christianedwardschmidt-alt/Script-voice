'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BRAND_PREVIEW_EVENT, getBrandPreview } from '@/lib/brandPreview'

// ── SVG icon components ──────────────────────────────────────────────────────

function IconDashboard({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  )
}

function IconUsers({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconFileText({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function IconAI({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <path d="M8 9h.01M12 9h.01M16 9h.01" strokeWidth="2.5"/>
    </svg>
  )
}

function IconBarChart({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function IconLayout({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  )
}

function IconCalendar({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconSettings({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function IconHelp({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconBriefcase({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  )
}

function IconReceipt({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/>
      <line x1="16" y1="8" x2="8" y2="8"/>
      <line x1="16" y1="12" x2="8" y2="12"/>
    </svg>
  )
}

function IconCheckSquare({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}

function IconZap({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function IconGlobe({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function IconLogOut({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconChevronUp({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}

function IconUser({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconTax({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

function IconBook({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}

function IconPlug({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M7 17l-4 4M17 7l4-4M11 3l4 4-6 6-4-4 6-6zM12 20l-1-1 4-4 1 1a3 3 0 0 1-4 4z"/>
    </svg>
  )
}

function IconBell({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function IconCreditCard({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}

function IconMic({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

function IconAgents({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V8"/>
      <circle cx="12" cy="6" r="2"/>
      <circle cx="8.5" cy="16" r="1"/>
      <circle cx="15.5" cy="16" r="1"/>
      <path d="M9 19.5h6"/>
    </svg>
  )
}

function IconDocumentCheck({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <polyline points="9 15 11 17 15 12"/>
    </svg>
  )
}

function IconNote({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

function IconPenLine({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )
}

function IconNewspaper({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <line x1="18" y1="14" x2="12" y2="14"/>
      <line x1="18" y1="18" x2="12" y2="18"/>
      <rect x="12" y="6" width="6" height="4"/>
    </svg>
  )
}

// ── Nav structure ─────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { label: 'Dashboard',  href: '/dashboard',  Icon: IconDashboard,     key: '1' },
      { label: 'CRM',        href: '/crm',        Icon: IconBriefcase,     key: '5' },
      { label: 'Invoices',   href: '/invoicing',  Icon: IconReceipt,       key: '6' },
      { label: 'Proposals',  href: '/proposals',  Icon: IconDocumentCheck, key: '7' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'AI Companion', href: '/ai-assistant', Icon: IconAI,       key: undefined },
      { label: 'AI Agents',   href: '/agents',        Icon: IconAgents,   key: undefined },
      { label: 'Analytics',    href: '/insights',     Icon: IconBarChart,  key: undefined },
      { label: 'Calendar',     href: '/calendar',     Icon: IconCalendar,  key: '2' },
      { label: 'Tasks',          href: '/tasks',          Icon: IconCheckSquare, key: '3' },
      { label: 'Notes',          href: '/notes',          Icon: IconNote,        key: undefined },
      { label: 'Transcriptions', href: '/transcriptions', Icon: IconMic,         key: undefined },
    ],
  },
  {
    label: 'DISCOVER',
    items: [
      { label: 'Industry News', href: '/news',  Icon: IconNewspaper, key: undefined },
      { label: 'Blog',          href: '/blog',  Icon: IconPenLine,   key: undefined },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { label: 'Feed',    href: '/community', Icon: IconLayout,  key: undefined },
      { label: 'Members', href: '/clients',   Icon: IconUsers,   key: '4' },
      { label: 'Jobs',    href: '/jobs',      Icon: IconZap,     key: '8' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { label: 'Profile',       href: '/profile',       Icon: IconUser,       key: undefined },
      { label: 'Billing',       href: '/billing',       Icon: IconCreditCard, key: undefined },
      { label: 'Integrations',  href: '/integrations',  Icon: IconPlug,       key: undefined },
      { label: 'Notifications', href: '/notifications', Icon: IconBell,       key: undefined },
    ],
  },
]

const BOTTOM_NAV = [
  { label: 'Tax Center', href: '/tax',       Icon: IconTax },
  { label: 'Education',  href: '/education', Icon: IconBook },
  { label: 'Help',       href: '/contact',   Icon: IconHelp },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('Chris Schmidt')
  const [displayEmail, setDisplayEmail] = useState('chris@example.com')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLSpanElement>(null)
  const taglineRef = useRef<HTMLSpanElement>(null)
  const [taglineAdjust, setTaglineAdjust] = useState({ scaleX: 1 })
  const [showVeruno, setShowVeruno] = useState(false)

  // Admin-only, this-browser-only brand preview toggle (set from
  // /admin/sandbox) — persists across client-side navigation instead of
  // being tied to one route, since Sidebar itself never unmounts.
  useEffect(() => {
    function sync() { setShowVeruno(getBrandPreview()) }
    sync()
    window.addEventListener(BRAND_PREVIEW_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(BRAND_PREVIEW_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Scales the tagline so its rendered width matches the GuildWire
  // wordmark's width exactly, measured live in the browser rather than
  // hard-coded — font metrics vary enough across OS/browser rendering that
  // a fixed pixel offset tuned to one environment won't hold on another.
  useLayoutEffect(() => {
    function measure() {
      const logoEl = logoRef.current
      const taglineEl = taglineRef.current
      if (!logoEl || !taglineEl) return

      const logoWidth = logoEl.getBoundingClientRect().width

      // Neutralize any previously-applied scale before measuring the
      // tagline's true natural width, so this stays correct across repeat
      // calls (e.g. the fonts.ready re-measurement below).
      const prevTransform = taglineEl.style.transform
      taglineEl.style.transform = 'none'
      const naturalWidth = taglineEl.getBoundingClientRect().width
      taglineEl.style.transform = prevTransform
      if (!logoWidth || !naturalWidth) return

      // Scale the tagline's box so its width matches the wordmark's width
      // exactly — both start at the same left edge (siblings in the same
      // flex column), so a left-anchored scaleX makes both the left and
      // right edges land in the same place.
      const scaleX = logoWidth / naturalWidth
      setTaglineAdjust({ scaleX })
    }
    measure()
    document.fonts?.ready?.then(measure)
  }, [showVeruno])

  useEffect(() => {
    function toggle() { setIsMobileOpen(v => !v) }
    window.addEventListener('toggle-sidebar', toggle)
    return () => window.removeEventListener('toggle-sidebar', toggle)
  }, [])

  useEffect(() => { setIsMobileOpen(false) }, [pathname])

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d?.displayName) setDisplayName(d.displayName)
      if (d?.email) setDisplayEmail(d.email)
    }).catch(() => {})
    setIsDemo(document.cookie.includes('gw_demo=1'))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUserMenu])

  useEffect(() => {
    const allItems = NAV_GROUPS.flatMap(g => g.items)
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.key.match(/^[0-9]$/)) return
      const item = allItems.find(i => i.key === e.key)
      if (item) { e.preventDefault(); router.push(item.href) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function navItem(href: string, Icon: React.ComponentType<{ size?: number; color?: string }>, label: string) {
    const active = pathname === href
    const iconColor = active ? '#16A34A' : '#9CA3AF'
    const labelColor = active ? '#111827' : '#6B7280'
    const bg = active ? 'rgba(22,163,74,0.08)' : 'transparent'
    const shadow = active ? 'inset 2px 0 0 #16A34A' : 'none'

    return (
      <Link
        key={href}
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 20px', margin: '2px 12px', borderRadius: 'var(--radius-md)',
          color: labelColor,
          background: bg,
          boxShadow: shadow,
          fontSize: 14, fontWeight: active ? 600 : 400,
          textDecoration: 'none',
          transition: 'all 0.15s ease',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = '#F9FAFB'
            e.currentTarget.style.color = '#111827'
            const svg = e.currentTarget.querySelector('svg')
            if (svg) svg.setAttribute('stroke', '#374151')
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6B7280'
            const svg = e.currentTarget.querySelector('svg')
            if (svg) svg.setAttribute('stroke', '#9CA3AF')
          }
        }}
      >
        <Icon size={18} color={iconColor} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <div
        className={`sidebar-backdrop${isMobileOpen ? ' sidebar-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />
      <aside
        className={`sidebar-aside${isMobileOpen ? ' sidebar-open' : ''}`}
        style={{
          width: 240, height: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #F3F4F6',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0,
          zIndex: 50,
          overflowY: 'auto', overflowX: 'hidden',
        }}
      >

        {/* Logo */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span ref={logoRef} style={{ fontFamily: 'var(--font-body)', fontSize: showVeruno ? 60 : 28, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {showVeruno ? (
                <span style={{ color: '#111827' }}>Veruno</span>
              ) : (
                <>
                  <span style={{ color: '#111827' }}>Guild</span><span style={{ color: '#16A34A' }}>Wire</span>
                </>
              )}
            </span>
            <span
              ref={taglineRef}
              style={{
                fontSize: 9, fontWeight: 500, color: '#9CA3AF', lineHeight: 1,
                display: 'block', whiteSpace: 'nowrap',
                transform: `scaleX(${taglineAdjust.scaleX})`,
                transformOrigin: 'left',
              }}
            >
              Work for yourself. Never by yourself.
            </span>
          </Link>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, paddingTop: 12, overflowY: 'auto' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#9CA3AF',
                padding: '8px 20px 4px',
                fontFamily: 'var(--font-body)',
              }}>{group.label}</div>
              {group.items.map(({ label, href, Icon }) => navItem(href, Icon, label))}
            </div>
          ))}
        </nav>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ margin: '0 12px 10px', padding: '10px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#818CF8', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Demo mode</div>
            <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4, marginBottom: 8, fontFamily: 'var(--font-body)' }}>You&apos;re browsing read-only sample data.</div>
            <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '6px 10px', background: '#6366F1', color: '#fff', borderRadius: 7, fontSize: 11, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              Create free account
            </Link>
          </div>
        )}

        {/* Bottom nav items */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 8, flexShrink: 0 }}>
          {BOTTOM_NAV.map(({ label, href, Icon }) => navItem(href, Icon, label))}

          {/* User card */}
          <div ref={userMenuRef} style={{ position: 'relative', margin: '4px 0' }}>
            {showUserMenu && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 4,
                background: '#ffffff', border: '1px solid #F3F4F6',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                overflow: 'hidden', zIndex: 100,
              }}>
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#374151', fontWeight: 500, textDecoration: 'none', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <IconUser size={13} color="#9CA3AF" /> View Profile
                </Link>
                <div style={{ height: 1, background: '#F3F4F6' }} />
                <button
                  onClick={signOut}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', fontSize: 13, color: '#F87171', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <IconLogOut size={13} color="#F87171" /> Sign out
                </button>
              </div>
            )}

            <button
              onClick={() => setShowUserMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 20px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #14532D, #16A34A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                animation: 'pulse-dot 3s ease-in-out infinite',
              }}>{displayName.charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>{displayEmail}</div>
              </div>
              <div style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <IconChevronUp size={13} color="#9CA3AF" />
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
