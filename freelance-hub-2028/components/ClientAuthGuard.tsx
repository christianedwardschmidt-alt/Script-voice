'use client'
import { useEffect } from 'react'

export default function ClientAuthGuard() {
  useEffect(() => {
    const orig = window.fetch
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const res = await orig.call(window, input, init)
      if (res.status === 401) {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof Request
            ? input.url
            : input.toString()
        if (url.startsWith('/api/')) {
          window.location.replace('/login')
          // Return null while redirect completes; callers use ?? [] / ?? null guards
          return new Response('null', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
      return res
    }
    return () => {
      window.fetch = orig
    }
  }, [])
  return null
}
