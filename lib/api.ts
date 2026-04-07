// ---------------------------------------------------------------------------
// api — typed client-side functions for all REST mutations.
//
// Components never import this directly. All calls go through mutationQueue,
// which wraps each function with optimistic update + confirm/rollback.
//
// Phase 2: replace with WebSocket mutations or Liveblocks storage writes.
// The mutationQueue interface stays the same; only this file changes.
// ---------------------------------------------------------------------------

import type { BoardSnapshot, Card, Column } from '@/types/board'

const BOARD_ID = 'board-1'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // ---- Board ---------------------------------------------------------------

  getSnapshot: () =>
    request<BoardSnapshot>(`/api/boards/${BOARD_ID}`),

  // ---- Cards ---------------------------------------------------------------

  addCard: (card: Card) =>
    request<{ card: Card }>(`/api/boards/${BOARD_ID}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card }),
    }),

  updateCard: (cardId: string, patch: Partial<Pick<Card, 'title' | 'columnId' | 'position'>>) =>
    request<{ card: Card }>(`/api/boards/${BOARD_ID}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteCard: (cardId: string) =>
    request<{ ok: true }>(`/api/boards/${BOARD_ID}/cards/${cardId}`, {
      method: 'DELETE',
    }),

  // ---- Columns -------------------------------------------------------------

  addColumn: (column: Column) =>
    request<{ column: Column }>(`/api/boards/${BOARD_ID}/columns`, {
      method: 'POST',
      body: JSON.stringify({ column }),
    }),

  updateColumn: (columnId: string, patch: Partial<Pick<Column, 'title' | 'position'>>) =>
    request<{ column: Column }>(`/api/boards/${BOARD_ID}/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteColumn: (columnId: string) =>
    request<{ ok: true }>(`/api/boards/${BOARD_ID}/columns/${columnId}`, {
      method: 'DELETE',
    }),
}
