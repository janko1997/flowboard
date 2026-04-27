// ---------------------------------------------------------------------------
// liveblocksChannel — decouples mutationQueue.ts from Liveblocks.
//
// mutationQueue.ts calls the `broadcast*` functions after REST success.
// useLiveblocksWriter (a React hook) registers the actual Liveblocks
// writer callbacks at mount and clears them at unmount.
//
// Local-write tracking:
//   When we broadcast a change, we add the entityId to _pendingLocalIds.
//   useBoardSync's storage subscription checks consumeLocalWrite() before
//   calling applyServerDelta — if true, the change is ours and we skip it
//   (Zustand already has the optimistic state).
// ---------------------------------------------------------------------------

import type { Card, Column } from '@/types/board'

// ---------------------------------------------------------------------------
// Writer registration
// ---------------------------------------------------------------------------

type LiveblocksWriter = {
  setCard:      (card: Card) => void
  deleteCard:   (cardId: string) => void
  setColumn:    (column: Column) => void
  deleteColumn: (columnId: string) => void
}

let _writer: LiveblocksWriter | null = null

/** Called by useLiveblocksWriter on mount / unmount. */
export function registerLiveblocksWriter(writer: LiveblocksWriter | null) {
  _writer = writer
}

// ---------------------------------------------------------------------------
// Local-write tracking
// ---------------------------------------------------------------------------

const _pendingLocalIds = new Set<string>()

/**
 * Returns true and removes the entry if entityId was written locally.
 * Called by useBoardSync to skip echoes of our own storage writes.
 */
export function consumeLocalWrite(entityId: string): boolean {
  return _pendingLocalIds.delete(entityId)
}

// ---------------------------------------------------------------------------
// Broadcast helpers — called by mutationQueue after REST success
// ---------------------------------------------------------------------------

export function broadcastSetCard(card: Card) {
  _pendingLocalIds.add(card.id)
  _writer?.setCard(card)
}

export function broadcastDeleteCard(cardId: string) {
  _pendingLocalIds.add(cardId)
  _writer?.deleteCard(cardId)
}

export function broadcastSetColumn(column: Column) {
  _pendingLocalIds.add(column.id)
  _writer?.setColumn(column)
}

export function broadcastDeleteColumn(columnId: string) {
  _pendingLocalIds.add(columnId)
  _writer?.deleteColumn(columnId)
}
