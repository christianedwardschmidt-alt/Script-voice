import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#F9FAFB', fontFamily: 'var(--font-inter, system-ui, sans-serif)' }}>
        {children}
      </body>
    </html>
  )
}
