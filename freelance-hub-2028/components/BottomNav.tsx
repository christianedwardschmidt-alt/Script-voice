'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Receipt, Users, Menu } from 'lucide-react'

const TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { href: '/invoicing', icon: Receipt,          label: 'Invoicing' },
  { href: '/clients',   icon: Users,            label: 'Clients' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className={`bottom-nav-item${active ? ' active' : ''}`}>
            <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
            <span>{label}</span>
          </Link>
        )
      })}
      <button
        className="bottom-nav-item"
        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        aria-label="More navigation"
      >
        <Menu size={22} strokeWidth={1.6} />
        <span>More</span>
      </button>
    </nav>
  )
}
