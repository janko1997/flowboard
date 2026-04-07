'use client'

import { useEffect } from 'react'
import { useBoardStore } from '@/store'
import { api } from '@/lib/api'
import { mockBoardSnapshot } from '@/lib/mockData'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectHeader } from '@/components/board/ProjectHeader'
import { BoardCanvas } from '@/components/board/BoardCanvas'

export default function BoardPage() {
  const hydrate = useBoardStore(s => s.hydrate)
  const board   = useBoardStore(s => s.board)

  useEffect(() => {
    let cancelled = false
    api.getSnapshot()
      .then(snapshot => { if (!cancelled) hydrate(snapshot) })
      .catch(() => {
        // Server store not yet seeded (e.g. first cold start) — fall back to
        // mock data. Phase 2: replace with real error handling / retry logic.
        if (!cancelled) hydrate(mockBoardSnapshot)
      })
    return () => { cancelled = true }
  }, [hydrate])

  if (!board) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-container-highest border-t-primary" />
            <p className="text-sm text-on-surface-variant">Loading board…</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <ProjectHeader />
      <BoardCanvas />
    </AppShell>
  )
}
