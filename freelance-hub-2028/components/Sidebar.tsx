'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  BookOpen, BarChart2, Bot, Settings,
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
      width: 64,
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 16,
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      gap: 0,
    }}>

      {/* Logo mark */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.07)', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #007a3a, #00b857)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,184,87,0.3)',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '-0.5px' }}>LF</span>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', padding: '0 13px' }}>
        {mainNav.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={`nav-item${pathname === href ? ' active' : ''}`}
            style={{ width: '100%' }}
          >
            <Icon size={16} strokeWidth={pathname === href ? 2.2 : 1.7} />
          </Link>
        ))}
      </nav>

      {/* Bottom prefs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', padding: '12px 13px 0', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        {prefNav.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={`nav-item${pathname === href ? ' active' : ''}`}
            style={{ width: '100%' }}
          >
            <Icon size={16} strokeWidth={1.7} />
          </Link>
        ))}

        {/* Avatar */}
        <div style={{ marginTop: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #007a3a, #00b857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            cursor: 'pointer',
          }}>C</div>
        </div>
      </div>
    </aside>
  )
}
