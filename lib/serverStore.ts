// ---------------------------------------------------------------------------
// serverStore — in-memory board state for Phase 1 REST API.
//
// Lives on `globalThis` so it survives Next.js HMR reloads in development.
// On a true server restart the store re-initialises from mock data — this is
// acceptable for Phase 1. Phase 2 replaces this with a real database.
//
// All mutation functions are synchronous and operate on plain objects.
// Route handlers call these directly; there is no locking or concurrency
// control (single-user Phase 1 does not need it).
// ---------------------------------------------------------------------------

import type { Board, Card, Column } from '@/types/board'
import { mockBoardSnapshot } from './mockData'

interface ServerBoard {
  board: Board
  columns: Record<string, Column>
  cards: Record<string, Card>
}

// Extend globalThis so TypeScript is happy across HMR reloads.
declare global {
  // eslint-disable-next-line no-var
  var __flowboardStore: Map<string, ServerBoard> | undefined
}

function store(): Map<string, ServerBoard> {
  globalThis.__flowboardStore ??= new Map()
  return globalThis.__flowboardStore
}

function getOrInit(boardId: string): ServerBoard {
  if (!store().has(boardId)) {
    const { board, columns, cards } = mockBoardSnapshot
    store().set(boardId, {
      board:   { ...board },
      columns: Object.fromEntries(columns.map(c => [c.id, { ...c }])),
      cards:   Object.fromEntries(cards.map(c => [c.id, { ...c }])),
    })
  }
  return store().get(boardId)!
}

// ---- Read ------------------------------------------------------------------

export function getBoard(boardId: string): ServerBoard | null {
  return getOrInit(boardId)
}

// ---- Card mutations --------------------------------------------------------

export function addCard(boardId: string, card: Card): Card {
  const b = getOrInit(boardId)
  b.cards[card.id] = { ...card }
  return b.cards[card.id]
}

export function updateCard(
  boardId: string,
  cardId: string,
  patch: Partial<Pick<Card, 'title' | 'columnId' | 'position'>>,
): Card | null {
  const b = getOrInit(boardId)
  if (!b.cards[cardId]) return null
  Object.assign(b.cards[cardId], patch, { updatedAt: Date.now() })
  return b.cards[cardId]
}

export function deleteCard(boardId: string, cardId: string): boolean {
  const b = getOrInit(boardId)
  if (!b.cards[cardId]) return false
  delete b.cards[cardId]
  return true
}

// ---- Column mutations ------------------------------------------------------

export function addColumn(boardId: string, column: Column): Column {
  const b = getOrInit(boardId)
  b.columns[column.id] = { ...column }
  return b.columns[column.id]
}

export function updateColumn(
  boardId: string,
  columnId: string,
  patch: Partial<Pick<Column, 'title' | 'position'>>,
): Column | null {
  const b = getOrInit(boardId)
  if (!b.columns[columnId]) return null
  Object.assign(b.columns[columnId], patch, { updatedAt: Date.now() })
  return b.columns[columnId]
}

export function deleteColumn(boardId: string, columnId: string): boolean {
  const b = getOrInit(boardId)
  if (!b.columns[columnId]) return false
  // Cascade-delete all cards belonging to this column.
  Object.values(b.cards).forEach(card => {
    if (card.columnId === columnId) delete b.cards[card.id]
  })
  delete b.columns[columnId]
  return true
}
