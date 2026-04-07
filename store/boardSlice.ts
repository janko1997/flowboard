// ---------------------------------------------------------------------------
// boardSlice — source of truth for all board data.
//
// DESIGN NOTES:
// - Flat maps (Record<id, entity>) instead of nested arrays. Updating one
//   card only touches cards[cardId], not the entire column array. This is
//   what makes per-card selector memoization work correctly.
// - `columnOrder` and `cardOrder` are derived STORE INDICES, not DB fields.
//   They are rebuilt on hydrate() and updated incrementally on each mutation.
//   Never put columnOrder on the Board entity or cardOrder on Column.
// - Private `_apply*` helpers contain the actual state mutation logic.
//   Both optimistic actions AND the future applyServerDelta (Phase 2) call
//   these helpers. One implementation, two callers — they can never diverge.
// - `pendingMutations` is a plain Record (not a Map) for Immer + DevTools
//   compatibility. `pendingMutationIds` is the ordered list for rollback.
// - Rollback applies the stored inverse operation via the same `_apply*`
//   helpers — surgical, not a full-store snapshot restore.
// ---------------------------------------------------------------------------

import { nanoid } from 'nanoid'
import { comparePositions } from '@/lib/fractionalIndex'

// Immer-patched set: the callback receives a mutable draft of the slice.
// Typed against BoardSlice (not the full store) — slice factories only
// mutate their own state. The cast to the full store type happens once
// in store/index.ts when slices are composed.
type ImmerSet = (fn: (draft: BoardSlice) => void) => void
import type { Board, Card, Column, BoardSnapshot } from '@/types/board'
import type {
  PendingMutation,
  InverseOperation,
  MoveCardPayload,
  AddCardPayload,
  RenameCardPayload,
  DeleteCardPayload,
  MoveColumnPayload,
  AddColumnPayload,
  RenameColumnPayload,
  DeleteColumnPayload,
} from '@/types/mutations'

// ---------------------------------------------------------------------------
// Slice shape
// ---------------------------------------------------------------------------

export interface BoardSlice {
  board: Board | null
  columns: Record<string, Column>
  cards: Record<string, Card>
  /** Derived index: sorted card IDs per column. Never stored in the DB. */
  cardOrder: Record<string, string[]>
  /** Derived index: sorted column IDs. Never stored on the Board entity. */
  columnOrder: string[]

  // Optimistic layer
  pendingMutations: Record<string, PendingMutation>
  pendingMutationIds: string[]  // insertion-ordered for stack rollback

  // ---- Lifecycle ----------------------------------------------------------
  /**
   * Load server snapshot into the store. Converts arrays → flat maps and
   * builds the cardOrder / columnOrder indices.
   *
   * `rebasePending` is a Phase 2 stub: when true, pending mutations will be
   * re-applied on top of the fresh snapshot (needed after WS reconnect).
   * In Phase 1 this flag is always false and the code path is a no-op.
   */
  hydrate: (snapshot: BoardSnapshot, rebasePending?: boolean) => void

  // ---- Card mutations ------------------------------------------------------
  // Each optimistic action returns the mutation ID it enqueued so the caller
  // (mutationQueue) can confirm or roll back the exact mutation without relying
  // on pendingMutationIds.at(-1) — an implicit contract that breaks if an
  // action ever enqueues more than one mutation.
  optimisticAddCard: (payload: AddCardPayload) => string
  optimisticRenameCard: (payload: RenameCardPayload) => string
  optimisticDeleteCard: (payload: DeleteCardPayload) => string
  optimisticMoveCard: (payload: MoveCardPayload) => string

  // ---- Column mutations ----------------------------------------------------
  optimisticAddColumn: (payload: AddColumnPayload) => string
  optimisticRenameColumn: (payload: RenameColumnPayload) => string
  optimisticDeleteColumn: (payload: DeleteColumnPayload) => string
  optimisticMoveColumn: (payload: MoveColumnPayload) => string

  // ---- Mutation resolution -------------------------------------------------
  confirmMutation: (mutationId: string) => void
  rollbackMutation: (mutationId: string) => void
}

// ---------------------------------------------------------------------------
// Private helpers — the single implementation of each state transition.
//
// These are plain functions that mutate an Immer draft. Both the optimistic
// actions and the future applyServerDelta call them. If you need to fix a
// bug in "move card" logic, fix it here — nowhere else.
// ---------------------------------------------------------------------------

function _applyAddCard(
  draft: Pick<BoardSlice, 'cards' | 'cardOrder'>,
  card: Card
): void {
  draft.cards[card.id] = card
  const col = draft.cardOrder[card.columnId] ?? []
  col.push(card.id)
  // Re-sort by fractional position so the new card lands in the right slot.
  draft.cardOrder[card.columnId] = col.sort(
    (a, b) => comparePositions(draft.cards[a].position, draft.cards[b].position) || a.localeCompare(b)
  )
}

function _applyDeleteCard(
  draft: Pick<BoardSlice, 'cards' | 'cardOrder'>,
  cardId: string
): void {
  const card = draft.cards[cardId]
  if (!card) return
  draft.cardOrder[card.columnId] = (draft.cardOrder[card.columnId] ?? []).filter(
    id => id !== cardId
  )
  delete draft.cards[cardId]
}

function _applyRenameCard(
  draft: Pick<BoardSlice, 'cards'>,
  cardId: string,
  title: string
): void {
  if (!draft.cards[cardId]) return
  draft.cards[cardId].title = title
  draft.cards[cardId].updatedAt = Date.now()
}

function _applyMoveCard(
  draft: Pick<BoardSlice, 'cards' | 'cardOrder'>,
  payload: MoveCardPayload
): void {
  const card = draft.cards[payload.cardId]
  if (!card) return

  // Remove from source column order
  const sourceColId = card.columnId
  draft.cardOrder[sourceColId] = (draft.cardOrder[sourceColId] ?? []).filter(
    id => id !== payload.cardId
  )

  // Update card fields
  card.columnId   = payload.toColumnId
  card.position   = payload.newPosition
  card.updatedAt  = Date.now()

  // Insert into target column order and re-sort
  const targetCol = draft.cardOrder[payload.toColumnId] ?? []
  targetCol.push(payload.cardId)
  draft.cardOrder[payload.toColumnId] = targetCol.sort(
    (a, b) => comparePositions(draft.cards[a].position, draft.cards[b].position) || a.localeCompare(b)
  )
}

function _applyAddColumn(
  draft: Pick<BoardSlice, 'columns' | 'columnOrder'>,
  column: Column
): void {
  draft.columns[column.id] = column
  draft.columnOrder.push(column.id)
  draft.columnOrder.sort(
    (a, b) => comparePositions(draft.columns[a].position, draft.columns[b].position) || a.localeCompare(b)
  )
}

function _applyDeleteColumn(
  draft: Pick<BoardSlice, 'columns' | 'columnOrder' | 'cards' | 'cardOrder'>,
  columnId: string
): void {
  // Cascade-delete all cards in this column
  const cardIds = draft.cardOrder[columnId] ?? []
  cardIds.forEach(id => delete draft.cards[id])
  delete draft.cardOrder[columnId]

  draft.columnOrder = draft.columnOrder.filter(id => id !== columnId)
  delete draft.columns[columnId]
}

function _applyRenameColumn(
  draft: Pick<BoardSlice, 'columns'>,
  columnId: string,
  title: string
): void {
  if (!draft.columns[columnId]) return
  draft.columns[columnId].title     = title
  draft.columns[columnId].updatedAt = Date.now()
}

function _applyMoveColumn(
  draft: Pick<BoardSlice, 'columns' | 'columnOrder'>,
  payload: MoveColumnPayload
): void {
  const col = draft.columns[payload.columnId]
  if (!col) return
  col.position   = payload.newPosition
  col.updatedAt  = Date.now()
  draft.columnOrder.sort(
    (a, b) => comparePositions(draft.columns[a].position, draft.columns[b].position) || a.localeCompare(b)
  )
}

// ---------------------------------------------------------------------------
// Helper: enqueue a pending mutation and return its ID
// ---------------------------------------------------------------------------

function _enqueue(
  draft: Pick<BoardSlice, 'pendingMutations' | 'pendingMutationIds'>,
  type: PendingMutation['type'],
  inverse: InverseOperation,
  entityId: string,
  id = nanoid()   // caller pre-generates so the ID is known before set() completes
): string {
  draft.pendingMutations[id] = {
    id,
    type,
    entityId,
    enqueuedAt: Date.now(),
    status: 'pending',
    inverseOperation: inverse,
  }
  draft.pendingMutationIds.push(id)
  return id
}

// ---------------------------------------------------------------------------
// Helper: remove confirmed mutations from the front of the queue.
//
// A confirmed mutation lingers in pendingMutations (status:'confirmed') so
// rollbackMutation can detect same-entity ordering conflicts. Once no pending
// mutation precedes it, it is safe to prune — it will never be needed again.
// ---------------------------------------------------------------------------

function _pruneConfirmed(
  draft: Pick<BoardSlice, 'pendingMutations' | 'pendingMutationIds'>
): void {
  while (draft.pendingMutationIds.length > 0) {
    const headId = draft.pendingMutationIds[0]
    const head   = draft.pendingMutations[headId]
    if (head?.status === 'confirmed') {
      draft.pendingMutationIds.shift()
      delete draft.pendingMutations[headId]
    } else {
      break  // head is still 'pending' — nothing behind it can be pruned yet
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: apply an inverse operation to roll back a single mutation
// ---------------------------------------------------------------------------

function _applyInverse(
  draft: BoardSlice,
  inverse: InverseOperation
): void {
  // inverse.type is the operation TO APPLY (not the operation to undo).
  // e.g. inverse type ADD_CARD means "add this card" — used to roll back a DELETE.
  switch (inverse.type) {
    case 'ADD_CARD':
      _applyAddCard(draft, inverse.payload.card)
      break
    case 'DELETE_CARD':
      _applyDeleteCard(draft, inverse.payload.cardId)
      break
    case 'RENAME_CARD':
      _applyRenameCard(draft, inverse.payload.cardId, inverse.payload.title)
      break
    case 'MOVE_CARD':
      _applyMoveCard(draft, inverse.payload)
      break
    case 'ADD_COLUMN':
      _applyAddColumn(draft, inverse.payload.column)
      break
    case 'DELETE_COLUMN':
      _applyDeleteColumn(draft, inverse.payload.columnId)
      break
    case 'RENAME_COLUMN':
      _applyRenameColumn(draft, inverse.payload.columnId, inverse.payload.title)
      break
    case 'MOVE_COLUMN':
      _applyMoveColumn(draft, inverse.payload)
      break
  }
}

// ---------------------------------------------------------------------------
// Slice factory
// ---------------------------------------------------------------------------

export const createBoardSlice = (set: ImmerSet): BoardSlice => ({
  board:              null,
  columns:            {},
  cards:              {},
  cardOrder:          {},
  columnOrder:        [],
  pendingMutations:   {},
  pendingMutationIds: [],

  // ---- Lifecycle -----------------------------------------------------------

  hydrate: (snapshot, rebasePending = false) => {
    set(draft => {
      // Convert server arrays → flat maps
      draft.board   = snapshot.board
      draft.columns = Object.fromEntries(snapshot.columns.map(c => [c.id, c]))
      draft.cards   = Object.fromEntries(snapshot.cards.map(c => [c.id, c]))

      // Build columnOrder index from fractional positions
      draft.columnOrder = snapshot.columns
        .slice()
        .sort((a, b) => comparePositions(a.position, b.position) || a.id.localeCompare(b.id))
        .map(c => c.id)

      // Build cardOrder index: group cards by column, sort within each group
      draft.cardOrder = {}
      for (const col of snapshot.columns) {
        draft.cardOrder[col.id] = snapshot.cards
          .filter(card => card.columnId === col.id)
          .sort((a, b) => comparePositions(a.position, b.position) || a.id.localeCompare(b.id))
          .map(card => card.id)
      }

      // Phase 2 stub: re-apply pending mutations on top of fresh snapshot.
      // Required after WebSocket reconnect so in-flight optimistic updates
      // are not silently discarded by the hydrate overwrite.
      if (rebasePending) {
        // TODO Phase 2: iterate pendingMutationIds and re-apply each mutation
        // using its original payload via the _apply* helpers.
        console.warn('[FlowBoard] rebasePending not yet implemented (Phase 2)')
      }
    })
  },

  // ---- Card mutations ------------------------------------------------------

  optimisticAddCard: (payload) => {
    const mutId = nanoid()
    set(draft => {
      _applyAddCard(draft, payload.card)
      _enqueue(draft, 'ADD_CARD', {
        type: 'DELETE_CARD',
        payload: { cardId: payload.card.id, columnId: payload.card.columnId },
      }, payload.card.id, mutId)
    })
    return mutId
  },

  optimisticRenameCard: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const oldTitle = draft.cards[payload.cardId]?.title ?? ''
      _applyRenameCard(draft, payload.cardId, payload.title)
      _enqueue(draft, 'RENAME_CARD', {
        type: 'RENAME_CARD',
        payload: { cardId: payload.cardId, title: oldTitle },
      }, payload.cardId, mutId)
    })
    return mutId
  },

  optimisticDeleteCard: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const card = draft.cards[payload.cardId]
      if (!card) return
      const cardSnapshot = { ...card }
      _applyDeleteCard(draft, payload.cardId)
      _enqueue(draft, 'DELETE_CARD', {
        type: 'ADD_CARD',
        payload: { card: cardSnapshot },
      }, payload.cardId, mutId)
    })
    return mutId
  },

  optimisticMoveCard: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const card = draft.cards[payload.cardId]
      if (!card) return
      const inverse: InverseOperation = {
        type: 'MOVE_CARD',
        payload: {
          cardId:      payload.cardId,
          toColumnId:  card.columnId,
          newPosition: card.position,
        },
      }
      _applyMoveCard(draft, payload)
      _enqueue(draft, 'MOVE_CARD', inverse, payload.cardId, mutId)
    })
    return mutId
  },

  // ---- Column mutations ----------------------------------------------------

  optimisticAddColumn: (payload) => {
    const mutId = nanoid()
    set(draft => {
      _applyAddColumn(draft, payload.column)
      _enqueue(draft, 'ADD_COLUMN', {
        type: 'DELETE_COLUMN',
        payload: { columnId: payload.column.id },
      }, payload.column.id, mutId)
    })
    return mutId
  },

  optimisticRenameColumn: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const oldTitle = draft.columns[payload.columnId]?.title ?? ''
      _applyRenameColumn(draft, payload.columnId, payload.title)
      _enqueue(draft, 'RENAME_COLUMN', {
        type: 'RENAME_COLUMN',
        payload: { columnId: payload.columnId, title: oldTitle },
      }, payload.columnId, mutId)
    })
    return mutId
  },

  optimisticDeleteColumn: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const column = draft.columns[payload.columnId]
      if (!column) return
      const columnSnapshot = { ...column }
      _applyDeleteColumn(draft, payload.columnId)
      _enqueue(draft, 'DELETE_COLUMN', {
        type: 'ADD_COLUMN',
        payload: { column: columnSnapshot },
      }, payload.columnId, mutId)
    })
    return mutId
  },

  optimisticMoveColumn: (payload) => {
    const mutId = nanoid()
    set(draft => {
      const col = draft.columns[payload.columnId]
      if (!col) return
      const inverse: InverseOperation = {
        type: 'MOVE_COLUMN',
        payload: { columnId: payload.columnId, newPosition: col.position },
      }
      _applyMoveColumn(draft, payload)
      _enqueue(draft, 'MOVE_COLUMN', inverse, payload.columnId, mutId)
    })
    return mutId
  },

  // ---- Mutation resolution -------------------------------------------------

  confirmMutation: (mutationId) => {
    set(draft => {
      const mut = draft.pendingMutations[mutationId]
      if (!mut) return
      // Mark confirmed but keep in the queue temporarily. rollbackMutation for
      // an earlier mutation on the same entity needs to see this record to know
      // it should skip the inverse. _pruneConfirmed cleans it up once safe.
      mut.status = 'confirmed'
      _pruneConfirmed(draft)
    })
  },

  /**
   * Roll back a failed mutation by applying its inverse operation.
   *
   * Option A — same-entity skip: if any later mutation on the same entity
   * was already confirmed, applying this inverse would put the entity behind
   * the server's current state. Skip the inverse and let Phase 2's
   * applyServerDelta reconcile. The mutation is removed either way.
   */
  rollbackMutation: (mutationId) => {
    set(draft => {
      const mutation = draft.pendingMutations[mutationId]
      if (!mutation) return

      const mutIdx = draft.pendingMutationIds.indexOf(mutationId)
      const skipInverse = draft.pendingMutationIds
        .slice(mutIdx + 1)
        .some(id => {
          const m = draft.pendingMutations[id]
          return m?.status === 'confirmed' && m.entityId === mutation.entityId
        })

      if (!skipInverse) {
        _applyInverse(draft, mutation.inverseOperation)
      }

      delete draft.pendingMutations[mutationId]
      draft.pendingMutationIds = draft.pendingMutationIds.filter(id => id !== mutationId)
      _pruneConfirmed(draft)
    })
  },
})
