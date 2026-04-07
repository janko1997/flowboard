// ---------------------------------------------------------------------------
// uiSlice — ephemeral UI state only.
//
// DESIGN NOTES:
// - Drag state is intentionally ABSENT from this slice. @dnd-kit fires
//   onDragOver at 60fps; storing drag state here would re-render every
//   subscribed component on every pointer move. Drag state lives in
//   DragContext (a React context local to BoardCanvas). See CLAUDE.md.
// - `darkMode` always initializes as `false` so server and client render
//   the same HTML (avoiding hydration mismatch). AppShell reads the real
//   preference from localStorage in a useEffect after hydration and calls
//   setDarkMode() to sync. See AppShell.tsx.
// - `selectedCardId` drives the card ring highlight (Phase 1).
//   Phase 2 will overlay the editing tooltip on the same card.
// ---------------------------------------------------------------------------

export interface UISlice {
  /** Whether the board is in dark mode. Persisted to localStorage. */
  darkMode: boolean
  /** ID of the card whose detail panel is open / ring is shown. null = none. */
  selectedCardId: string | null
  /** ID of the column whose context menu is open. null = closed. */
  openColumnMenuId: string | null
  /** ID of the column showing the inline add-card form. null = none. */
  addingCardToColumnId: string | null

  toggleDarkMode:        () => void
  /** Called by AppShell after mount to sync localStorage → store. */
  setDarkMode:           (value: boolean) => void
  selectCard:            (cardId: string | null) => void
  openColumnMenu:        (columnId: string | null) => void
  setAddingCardToColumn: (columnId: string | null) => void
}

type ImmerSet = (fn: (draft: UISlice) => void) => void

export const createUISlice = (set: ImmerSet): UISlice => ({
  // Always false on init — server and client agree, no hydration mismatch.
  // AppShell reads the real preference after mount via setDarkMode().
  darkMode:             false,
  selectedCardId:       null,
  openColumnMenuId:     null,
  addingCardToColumnId: null,

  toggleDarkMode: () => set(draft => {
    draft.darkMode = !draft.darkMode
    localStorage.setItem('flowboard-dark-mode', String(draft.darkMode))
  }),

  setDarkMode: (value: boolean) => set(draft => { draft.darkMode = value }),

  selectCard:            (cardId: string | null)   => set(draft => { draft.selectedCardId       = cardId }),
  openColumnMenu:        (columnId: string | null) => set(draft => { draft.openColumnMenuId     = columnId }),
  setAddingCardToColumn: (columnId: string | null) => set(draft => { draft.addingCardToColumnId = columnId }),
})
