'use client'

import { use, useEffect } from 'react'
import { LiveList, LiveMap } from '@liveblocks/client'
import { useBoardStore } from '@/store'
import { api } from '@/lib/api'
import { mockBoardSnapshot } from '@/lib/mockData'
import { RoomProvider } from '@/lib/liveblocks'
import { randomName, randomHue } from '@/lib/randomIdentity'

// Generated once per page load — replaced by auth identity in Phase 3.
const MY_NAME = randomName()
const MY_HUE  = randomHue()
import { useBoardSync } from '@/hooks/useBoardSync'
import { useLiveblocksWriter } from '@/hooks/useLiveblocksWriter'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectHeader } from '@/components/board/ProjectHeader'
import { BoardCanvas } from '@/components/board/BoardCanvas'
import { CursorOverlay } from '@/components/board/presence/CursorOverlay'
import { ReconnectBanner } from '@/components/board/presence/ReconnectBanner'

// ---------------------------------------------------------------------------
// BoardRoom — rendered inside RoomProvider so Liveblocks hooks are available.
// Owns the REST hydration fallback and calls useBoardSync for storage sync.
// ---------------------------------------------------------------------------
function BoardRoom() {
  useBoardSync()
  useLiveblocksWriter()

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
    <>
      <AppShell>
        <ProjectHeader />
        <BoardCanvas />
      </AppShell>
      <CursorOverlay />
      <ReconnectBanner />
    </>
  )
}

// ---------------------------------------------------------------------------
// BoardPage — owns RoomProvider. Keeps Liveblocks config out of BoardRoom.
// ---------------------------------------------------------------------------
export default function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params)

  return (
    <RoomProvider
      id={boardId}
      initialPresence={{ cursor: null, name: MY_NAME, hue: MY_HUE }}
      initialStorage={{
        cards: new LiveMap(),
        columns: new LiveMap(),
        columnOrder: new LiveList([]),
      }}
    >
      <BoardRoom />
    </RoomProvider>
  )
}
