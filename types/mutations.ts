// ---------------------------------------------------------------------------
// Mutation types for the optimistic update queue.
//
// DESIGN NOTES:
// - Each pending mutation stores an `inverseOperation` (not a full snapshot).
//   This means rolling back mutation A will not silently undo the effects of
//   mutation B that was applied after A on the same entity. See CLAUDE.md rule 13.
// - `pendingMutationIds: string[]` in the store maintains insertion order so
//   rollbacks always happen in reverse-enqueue order.
// - Payloads are typed per mutation so `_apply*` helpers are fully type-safe.
// ---------------------------------------------------------------------------

import type { Card, Column } from './board'

// ---- Mutation type union --------------------------------------------------

export type MutationType =
  | 'MOVE_CARD'
  | 'ADD_CARD'
  | 'RENAME_CARD'
  | 'DELETE_CARD'
  | 'MOVE_COLUMN'
  | 'ADD_COLUMN'
  | 'RENAME_COLUMN'
  | 'DELETE_COLUMN'

// ---- Per-mutation payloads ------------------------------------------------

export interface MoveCardPayload {
  cardId: string
  toColumnId: string
  newPosition: string
}

export interface AddCardPayload {
  card: Card
}

export interface RenameCardPayload {
  cardId: string
  title: string
}

export interface DeleteCardPayload {
  cardId: string
  /** Needed for rollback — which column to restore it to. */
  columnId: string
}

export interface MoveColumnPayload {
  columnId: string
  newPosition: string
}

export interface AddColumnPayload {
  column: Column
}

export interface RenameColumnPayload {
  columnId: string
  title: string
}

export interface DeleteColumnPayload {
  columnId: string
}

// ---- Discriminated union for inverse operations --------------------------
// Storing the inverse op (not a full state snapshot) means rollbacks are
// surgical — they only undo the specific fields this mutation changed.

// Each InverseOperation describes what to DO when rolling back a mutation —
// its type string is the operation to APPLY, not the operation that was taken.
// e.g. rolling back an ADD_CARD → store inverse type DELETE_CARD (just needs cardId)
//      rolling back a DELETE_CARD → store inverse type ADD_CARD (needs full Card)
export type InverseOperation =
  | { type: 'MOVE_CARD';     payload: MoveCardPayload }
  | { type: 'ADD_CARD';      payload: AddCardPayload }      // re-add a deleted card
  | { type: 'RENAME_CARD';   payload: RenameCardPayload }
  | { type: 'DELETE_CARD';   payload: DeleteCardPayload }   // remove an added card
  | { type: 'MOVE_COLUMN';   payload: MoveColumnPayload }
  | { type: 'ADD_COLUMN';    payload: AddColumnPayload }    // re-add a deleted column
  | { type: 'RENAME_COLUMN'; payload: RenameColumnPayload }
  | { type: 'DELETE_COLUMN'; payload: DeleteColumnPayload } // remove an added column

// ---- The pending mutation record -----------------------------------------

export interface PendingMutation {
  id: string
  type: MutationType
  /**
   * The primary entity this mutation touches (cardId or columnId).
   * Used by rollbackMutation to detect same-entity ordering conflicts:
   * if a later mutation on the same entity was already confirmed, the
   * rollback of this mutation is skipped to avoid going behind server state.
   */
  entityId: string
  enqueuedAt: number
  status: 'pending' | 'confirmed' | 'failed'
  inverseOperation: InverseOperation
}
