// ---------------------------------------------------------------------------
// Composed Zustand store — boardSlice + uiSlice under a single hook.
//
// Middleware stack (inside-out):
//   immer   → lets slice reducers mutate draft state directly
//   devtools → wires up Redux DevTools for inspection / time-travel
//
// Usage in components:
//   // Correct — selector scoped to one card, custom equality
//   const title = useBoardStore(useCallback(s => s.cards[cardId]?.title, [cardId]))
//
//   // Wrong — selects entire map, re-renders on every card change
//   const cards = useBoardStore(s => s.cards)
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import { createBoardSlice, type BoardSlice } from './boardSlice'
import { createUISlice, type UISlice } from './uiSlice'

export type StoreState = BoardSlice & UISlice

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySet = (fn: (draft: any) => void) => void

export const useBoardStore = create<StoreState>()(
  devtools(
    immer((set) => ({
      ...createBoardSlice(set as AnySet),
      ...createUISlice(set as AnySet),
    })),
    { name: 'FlowBoard' }
  )
)
