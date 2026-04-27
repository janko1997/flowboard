// ---------------------------------------------------------------------------
// mutationQueue — the single entry point for all board writes.
//
// Every exported function follows the same three-step contract:
//   1. Call the matching `optimistic*` store action  → UI updates instantly
//   2. Read the mutation ID that was just enqueued   → needed for step 3
//   3. Await the REST call
//        success → confirmMutation(id)  (removes from pending list)
//        failure → rollbackMutation(id) (applies inverse op, restores UI)
//
// Components import from here, never from `lib/api` directly.
// The optimistic* actions on the store are not called by components directly.
//
// WHY getState() after optimisticFn():
//   Zustand's `set` is synchronous — by the time optimisticFn() returns, the
//   store already holds the new pending mutation ID at pendingMutationIds.at(-1).
//   A fresh getState() call reads that updated slice.
// ---------------------------------------------------------------------------

import { useBoardStore } from '@/store'
import { api } from '@/lib/api'
import {
  broadcastSetCard,
  broadcastDeleteCard,
  broadcastSetColumn,
  broadcastDeleteColumn,
} from '@/store/liveblocksChannel'
import type {
  AddCardPayload,
  RenameCardPayload,
  DeleteCardPayload,
  MoveCardPayload,
  AddColumnPayload,
  RenameColumnPayload,
  DeleteColumnPayload,
  MoveColumnPayload,
} from '@/types/mutations'

// ---------------------------------------------------------------------------
// Internal helper — applies the optimistic action, grabs the resulting
// mutation ID, awaits the API call, then confirms or rolls back.
// ---------------------------------------------------------------------------

async function withOptimistic(
  optimisticFn: () => string,
  apiFn: () => Promise<unknown>,
  label: string,
  // Called after REST success + confirmMutation. Reads the now-confirmed state
  // to broadcast the change to Liveblocks storage so other clients receive it.
  // Optional: no-op when no Liveblocks writer is registered (e.g. in tests).
  afterConfirm?: () => void,
): Promise<void> {
  // optimisticFn returns the mutation ID it pre-generated so we own it
  // explicitly — no implicit at(-1) read that would break under batching.
  const mutId = optimisticFn()

  try {
    await apiFn()
    useBoardStore.getState().confirmMutation(mutId)
    afterConfirm?.()
  } catch (err) {
    console.error(`[mutate] ${label} failed — rolling back`, err)
    useBoardStore.getState().rollbackMutation(mutId)
  }
}

// ---------------------------------------------------------------------------
// Public API — one function per mutation type
// ---------------------------------------------------------------------------

export const mutate = {
  addCard: (payload: AddCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticAddCard(payload),
      () => api.addCard(payload.card),
      'addCard',
      () => {
        const card = useBoardStore.getState().cards[payload.card.id]
        if (card) broadcastSetCard(card)
      },
    ),

  renameCard: (payload: RenameCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticRenameCard(payload),
      () => api.updateCard(payload.cardId, { title: payload.title }),
      'renameCard',
      () => {
        const card = useBoardStore.getState().cards[payload.cardId]
        if (card) broadcastSetCard(card)
      },
    ),

  deleteCard: (payload: DeleteCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticDeleteCard(payload),
      () => api.deleteCard(payload.cardId),
      'deleteCard',
      // Card is already removed from the store — use payload for the broadcast
      () => broadcastDeleteCard(payload.cardId),
    ),

  moveCard: (payload: MoveCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticMoveCard(payload),
      () => api.updateCard(payload.cardId, {
        columnId: payload.toColumnId,
        position: payload.newPosition,
      }),
      'moveCard',
      () => {
        const card = useBoardStore.getState().cards[payload.cardId]
        if (card) broadcastSetCard(card)
      },
    ),

  addColumn: (payload: AddColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticAddColumn(payload),
      () => api.addColumn(payload.column),
      'addColumn',
      () => {
        const col = useBoardStore.getState().columns[payload.column.id]
        if (col) broadcastSetColumn(col)
      },
    ),

  renameColumn: (payload: RenameColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticRenameColumn(payload),
      () => api.updateColumn(payload.columnId, { title: payload.title }),
      'renameColumn',
      () => {
        const col = useBoardStore.getState().columns[payload.columnId]
        if (col) broadcastSetColumn(col)
      },
    ),

  deleteColumn: (payload: DeleteColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticDeleteColumn(payload),
      () => api.deleteColumn(payload.columnId),
      'deleteColumn',
      // Column already removed from store — use payload for the broadcast
      () => broadcastDeleteColumn(payload.columnId),
    ),

  moveColumn: (payload: MoveColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticMoveColumn(payload),
      () => api.updateColumn(payload.columnId, { position: payload.newPosition }),
      'moveColumn',
      () => {
        const col = useBoardStore.getState().columns[payload.columnId]
        if (col) broadcastSetColumn(col)
      },
    ),
}
