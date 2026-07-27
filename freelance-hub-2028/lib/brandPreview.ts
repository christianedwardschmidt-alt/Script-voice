import { useEffect, useState } from 'react'

export const BRAND_PREVIEW_KEY = 'gw_brand_preview'
export const BRAND_PREVIEW_TOUCHED_KEY = 'gw_brand_preview_touched'
export const BRAND_PREVIEW_EVENT = 'gw-brand-preview-change'

// Dedicated login for showing off the Veruno rebrand — separate from the
// admin account and from the pre-existing anonymous "try the demo" flow
// (demo@guildwire.io / gw_demo cookie), which is read-only and pushes
// visitors toward signing up, neither of which applies here.
export const VERUNO_DEMO_EMAIL = 'demo@veruno.io'

export function getBrandPreview(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(BRAND_PREVIEW_KEY) === 'veruno'
}

export function setBrandPreview(on: boolean) {
  if (on) {
    window.localStorage.setItem(BRAND_PREVIEW_KEY, 'veruno')
  } else {
    window.localStorage.removeItem(BRAND_PREVIEW_KEY)
  }
  window.localStorage.setItem(BRAND_PREVIEW_TOUCHED_KEY, '1')
  window.dispatchEvent(new Event(BRAND_PREVIEW_EVENT))
}

// Distinct from getBrandPreview() === false, which is also true before
// anyone has ever touched the toggle — this tells the Veruno demo account
// apart from "explicitly turned off" so it can default to on once per
// browser without fighting a deliberate toggle-off.
export function hasBrandPreviewBeenTouched(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(BRAND_PREVIEW_TOUCHED_KEY) === '1'
}

export function useBrandPreview(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    function sync() { setOn(getBrandPreview()) }
    sync()
    window.addEventListener(BRAND_PREVIEW_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(BRAND_PREVIEW_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return on
}
