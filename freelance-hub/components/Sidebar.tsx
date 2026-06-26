'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  Puzzle,
  Receipt,
  Users,
  FileText,
  Bot,
  Calculator,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#6366f1' },
  { href: '/crm', icon: Users, label: 'CRM', color: '#8b5cf6' },
  { href: '/invoicing', icon: FileText, label: 'Invoicing', color: '#06b6d4' },
  { href: '/tax', icon: Calculator, label: 'Tax Manager', color: '#10b981' },
  { href: '/education', icon: GraduationCap, label: 'Education', color: '#f59e0b' },
  { href: '/integrations', icon: Puzzle, label: 'Integrations', color: '#ec4899' },
  { href: '/community', icon: Receipt, label: 'Community', color: '#f97316' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant', color: '#a78bfa' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        background: '#0a0a18',
        borderRight: '1px solid #1a1a30',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid #1a1a30',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}
        >
          <Zap size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              FreelanceOS
            </div>
            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 500 }}>Pro Suite</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? '#818cf8' : '#64748b',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                borderRight: isActive ? '2px solid #6366f1' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
                overflow: 'hidden',
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                style={{ color: isActive ? item.color : '#475569', flexShrink: 0 }}
              />
              {!collapsed && (
                <span style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: 3, background: item.color }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1a1a30', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[
          { icon: Bell, label: 'Notifications' },
          { icon: Settings, label: 'Settings' },
          { icon: LogOut, label: 'Sign Out' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="sidebar-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '8px' : '8px 12px',
              borderRadius: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: '#475569',
              width: '100%',
            }}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13 }}>{label}</span>}
          </button>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          top: 24,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#141428',
          border: '1px solid #252545',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#6366f1',
          zIndex: 20,
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
