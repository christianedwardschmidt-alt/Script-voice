import { useEffect, useState } from 'react'

export { BRAND_PREVIEW_KEY, BRAND_PREVIEW_TOUCHED_KEY, BRAND_PREVIEW_EVENT, VERUNO_DEMO_EMAIL } from './brandPreviewConstants'
import { BRAND_PREVIEW_KEY, BRAND_PREVIEW_TOUCHED_KEY, BRAND_PREVIEW_EVENT } from './brandPreviewConstants'

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
