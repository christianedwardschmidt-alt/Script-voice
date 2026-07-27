// Plain constants only, deliberately kept free of any React import.
// lib/brandPreview.ts re-exports these for existing client-side call
// sites, but server-only code (API routes, etc.) should import straight
// from here — pulling anything from brandPreview.ts itself drags in
// useEffect/useState, which Next.js rejects outside a Client Component.

export const BRAND_PREVIEW_KEY = 'gw_brand_preview'
export const BRAND_PREVIEW_TOUCHED_KEY = 'gw_brand_preview_touched'
export const BRAND_PREVIEW_EVENT = 'gw-brand-preview-change'

// Dedicated login for showing off the Veruno rebrand — separate from the
// admin account and from the pre-existing anonymous "try the demo" flow
// (demo@guildwire.io / gw_demo cookie), which is read-only and pushes
// visitors toward signing up, neither of which applies here.
export const VERUNO_DEMO_EMAIL = 'demo@veruno.io'
