'use client'

import { useStatus } from '@/lib/liveblocks'

// Pure display component — derives visibility from Liveblocks status only.
// No Zustand involvement; no boardSlice state.
export function ReconnectBanner() {
  const status = useStatus()

  if (status !== 'reconnecting') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[9998] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-outline-variant/20 bg-surface-container-high px-5 py-2.5 shadow-lg"
    >
      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-surface-variant border-t-on-surface" />
      <span className="text-sm font-medium text-on-surface">Reconnecting…</span>
    </div>
  )
}
