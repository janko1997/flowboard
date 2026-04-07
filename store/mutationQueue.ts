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
): Promise<void> {
  // optimisticFn returns the mutation ID it pre-generated so we own it
  // explicitly — no implicit at(-1) read that would break under batching.
  const mutId = optimisticFn()

  try {
    await apiFn()
    useBoardStore.getState().confirmMutation(mutId)
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
    ),

  renameCard: (payload: RenameCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticRenameCard(payload),
      () => api.updateCard(payload.cardId, { title: payload.title }),
      'renameCard',
    ),

  deleteCard: (payload: DeleteCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticDeleteCard(payload),
      () => api.deleteCard(payload.cardId),
      'deleteCard',
    ),

  moveCard: (payload: MoveCardPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticMoveCard(payload),
      () => api.updateCard(payload.cardId, {
        columnId: payload.toColumnId,
        position: payload.newPosition,
      }),
      'moveCard',
    ),

  addColumn: (payload: AddColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticAddColumn(payload),
      () => api.addColumn(payload.column),
      'addColumn',
    ),

  renameColumn: (payload: RenameColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticRenameColumn(payload),
      () => api.updateColumn(payload.columnId, { title: payload.title }),
      'renameColumn',
    ),

  deleteColumn: (payload: DeleteColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticDeleteColumn(payload),
      () => api.deleteColumn(payload.columnId),
      'deleteColumn',
    ),

  moveColumn: (payload: MoveColumnPayload) =>
    withOptimistic(
      () => useBoardStore.getState().optimisticMoveColumn(payload),
      () => api.updateColumn(payload.columnId, { position: payload.newPosition }),
      'moveColumn',
    ),
}
