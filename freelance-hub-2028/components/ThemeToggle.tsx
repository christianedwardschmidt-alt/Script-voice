'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('gw_theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && systemDark)
    setDark(isDark)
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    localStorage.setItem('gw_theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'none', border: 'none',
        color: 'var(--text-3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        padding: 7, borderRadius: 8,
        transition: 'all 0.12s',
      }}
      className="theme-toggle-btn"
    >
      {dark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
      <style>{`.theme-toggle-btn:hover { background: var(--bg-3) !important; color: var(--text) !important; }`}</style>
    </button>
  )
}
