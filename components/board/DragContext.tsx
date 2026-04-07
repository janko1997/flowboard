'use client'

// ---------------------------------------------------------------------------
// DragContext — React context for active-drag state.
//
// Per CLAUDE.md rule: drag state MUST NOT go in Zustand. Zustand is updated
// exactly once — in onDragEnd — via optimisticMoveCard. Everything else
// (which card is airborne, visual feedback) lives here.
//
// Phase 2: extend this context with `activeColumnId` when column reordering
// is added. The pattern is identical.
// ---------------------------------------------------------------------------

import { createContext, useContext, useState, type ReactNode } from 'react'

interface DragState {
  activeCardId: string | null
  setActiveCardId: (id: string | null) => void
}

const DragContext = createContext<DragState>({
  activeCardId: null,
  setActiveCardId: () => {},
})

export function DragProvider({ children }: { children: ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  return (
    <DragContext.Provider value={{ activeCardId, setActiveCardId }}>
      {children}
    </DragContext.Provider>
  )
}

export const useDragContext = () => useContext(DragContext)
