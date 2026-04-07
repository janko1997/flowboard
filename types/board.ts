// ---------------------------------------------------------------------------
// Core domain types for FlowBoard.
//
// DESIGN NOTES:
// - All ordering uses fractional index strings (e.g. "a0", "a1", "Zz"),
//   never integers. This makes concurrent inserts conflict-free in Phase 2.
// - `columnOrder` and `cardOrder` are NOT stored on Board/Column entities.
//   They are derived indices maintained in the Zustand store, identical in
//   concept to a DB index — computed once on hydrate, updated incrementally.
// - `seqNo` is reserved on Card and Column now (optional, always undefined
//   in Phase 1) so Phase 2 can populate it without a type-level migration.
// ---------------------------------------------------------------------------

export interface Board {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface Column {
  id: string
  boardId: string
  title: string
  /** Fractional index string. Source of truth for column ordering. */
  position: string
  createdAt: number
  updatedAt: number
  /** Reserved for Phase 2 delta sync. Undefined in Phase 1. */
  seqNo?: number
}

// ---------------------------------------------------------------------------
// Card label / tag chip — shown at the top of each card.
// Colors map to Tailwind classes in LabelChip.tsx.
// ---------------------------------------------------------------------------

export type LabelVariant =
  | 'research'
  | 'feature'
  | 'bug'
  | 'refactor'
  | 'infrastructure'
  | 'design'

export interface CardLabel {
  text: string
  variant: LabelVariant
}

export interface Card {
  id: string
  columnId: string
  title: string
  description: string
  /** Fractional index string. Source of truth for card ordering within a column. */
  position: string
  createdAt: number
  updatedAt: number
  /** Reserved for Phase 2 delta sync. Undefined in Phase 1. */
  seqNo?: number

  // ---- Visual metadata (optional, shown if present) ----
  /** Tag chip shown at the top of the card. */
  label?: CardLabel
  /** ISO date string, e.g. "2024-10-24". Shown as a date badge. */
  dueDate?: string
  /**
   * Assignee initials for the avatar, e.g. "AJ".
   * Phase 1: static initials rendered as a colored div.
   * Phase 2: replaced by presence data from Liveblocks.
   */
  assigneeInitials?: string
  /** Hue (0–360) used to tint the assignee avatar background. */
  assigneeHue?: number
}

// ---------------------------------------------------------------------------
// API contract — what the server sends on initial load / reconnect.
// Arrays are used here (server shape); the store converts them to flat maps.
// ---------------------------------------------------------------------------

export interface BoardSnapshot {
  board: Board
  columns: Column[]
  cards: Card[]
}
