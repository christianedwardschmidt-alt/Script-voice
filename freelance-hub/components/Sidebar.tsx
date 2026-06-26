'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  CheckSquare,
  Users,
  Briefcase,
  MessageCircle,
  GraduationCap,
  Contact,
  FileBarChart,
  CreditCard,
  Wrench,
  User,
  Settings,
  LogOut,
} from 'lucide-react'

const mainNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/insights', icon: BarChart2, label: 'Insights' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
  { href: '/community', icon: MessageCircle, label: 'Community' },
  { href: '/education', icon: GraduationCap, label: 'Upskilling' },
  { href: '/contact', icon: Contact, label: 'Contact Info' },
  { href: '/tax', icon: FileBarChart, label: 'Tax Report' },
  { href: '/invoicing', icon: CreditCard, label: 'Billing' },
  { href: '/integrations', icon: Wrench, label: 'Workspace' },
]

const prefNav = [
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <aside
      style={{
        width: 210,
        minWidth: 210,
        background: '#13111f',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          L
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.3px' }}>
          Lance<span style={{ color: '#9f67f8' }}>Flo</span>
        </span>
      </div>

      {/* Main nav */}
      <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
        <div className="section-label">Main Menu</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mainNav.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Preference section */}
        <div className="section-label" style={{ marginTop: 24 }}>Preference</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {prefNav.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            )
          })}
          <button
            className="nav-item"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              color: '#9ca3af',
            }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            <span>Log Out</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
