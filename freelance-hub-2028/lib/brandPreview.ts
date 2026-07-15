import { useEffect, useState } from 'react'

export const BRAND_PREVIEW_KEY = 'gw_brand_preview'
export const BRAND_PREVIEW_EVENT = 'gw-brand-preview-change'

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
  window.dispatchEvent(new Event(BRAND_PREVIEW_EVENT))
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
