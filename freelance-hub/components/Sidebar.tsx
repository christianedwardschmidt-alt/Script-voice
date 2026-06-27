'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  BookOpen, BarChart2, Bot, Settings, LogOut,
  MessageSquare, Receipt, Plug, Briefcase, Zap,
  User, Contact,
} from 'lucide-react'

const mainNav = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Tasks',        href: '/tasks',        icon: CheckSquare     },
  { label: 'Clients',      href: '/clients',      icon: Users           },
  { label: 'CRM',          href: '/crm',          icon: Briefcase       },
  { label: 'Invoicing',    href: '/invoicing',    icon: Receipt         },
  { label: 'Community',    href: '/community',    icon: MessageSquare   },
  { label: 'Jobs',         href: '/jobs',         icon: Zap             },
  { label: 'Education',    href: '/education',    icon: BookOpen        },
  { label: 'Integrations', href: '/integrations', icon: Plug            },
  { label: 'Tax',          href: '/tax',          icon: FileText        },
  { label: 'Insights',     href: '/insights',     icon: BarChart2       },
  { label: 'AI Assistant', href: '/ai-assistant', icon: Bot             },
]

const prefNav = [
  { label: 'Profile',  href: '/profile',  icon: User     },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Contact',  href: '/contact',  icon: Contact  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 218,
      minHeight: '100vh',
      background: '#111110',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{ padding: '22px 16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '-0.5px' }}>LF</span>
          </div>
          <div>
            <div className="gradient-text" style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
              LanceFlo
            </div>
            <div style={{ fontSize: 9.5, color: '#2e3a55', fontWeight: 700, letterSpacing: '1px', marginTop: 1 }}>
              FREELANCE OS
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div className="section-label" style={{ padding: '4px 10px 8px' }}>WORKSPACE</div>
        {mainNav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item${pathname === href ? ' active' : ''}`}>
            <Icon size={15} strokeWidth={pathname === href ? 2.2 : 1.8} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom prefs */}
      <div style={{ padding: '10px 10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="section-label" style={{ padding: '10px 10px 8px' }}>ACCOUNT</div>
        {prefNav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item${pathname === href ? ' active' : ''}`}>
            <Icon size={15} strokeWidth={1.8} />
            {label}
          </Link>
        ))}
        <button className="nav-item" style={{ color: '#f87171', marginTop: 2 }}>
          <LogOut size={15} strokeWidth={1.8} />
          Log Out
        </button>
      </div>

      {/* User chip */}
      <div style={{ padding: '12px 12px 18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 11px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #f472b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>C</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Christian S.
            </div>
            <div style={{ fontSize: 10.5, color: '#3d4a6b', fontWeight: 500 }}>Pro Plan</div>
          </div>
          <div className="dot-green" style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  )
}
