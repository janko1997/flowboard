// ---------------------------------------------------------------------------
// ServerDelta — the unit of change broadcast from Liveblocks storage to all
// connected clients. applyServerDelta in boardSlice consumes these.
//
// DESIGN NOTES:
// - seqNo is a monotonic timestamp (Date.now() at write time in Phase 2,
//   a proper vector-clock value in Phase 3). Used to reject stale deltas.
// - SET_CARD covers both add and update; the store helper handles both cases.
// - DELETE_CARD carries columnId so the store can remove it from cardOrder
//   even after the entity is gone.
// ---------------------------------------------------------------------------

import type { Card, Column } from './board'

export type ServerDelta =
  | { type: 'SET_CARD';      card: Card;       seqNo: number }
  | { type: 'DELETE_CARD';   cardId: string;   columnId: string; seqNo: number }
  | { type: 'SET_COLUMN';    column: Column;   seqNo: number }
  | { type: 'DELETE_COLUMN'; columnId: string; seqNo: number }
