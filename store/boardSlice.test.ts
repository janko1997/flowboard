// ---------------------------------------------------------------------------
// Unit tests for applyServerDelta.
// Uses vanilla Zustand (createStore) — no React rendering required.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createBoardSlice, type BoardSlice } from './boardSlice'
import type { Board, Card, Column, BoardSnapshot } from '@/types/board'

// ---------------------------------------------------------------------------
// Minimal test store — same Immer middleware as the real store, isolated
// instance per test via the factory in beforeEach.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStore() {
  return createStore<BoardSlice>()(immer(set => createBoardSlice(set as any)))
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const board: Board = { id: 'b1', title: 'Test', createdAt: 0, updatedAt: 0 }

const col1: Column = {
  id: 'col1', boardId: 'b1', title: 'Todo',
  position: 'a0', createdAt: 0, updatedAt: 0,
}

const card1: Card = {
  id: 'c1', columnId: 'col1', title: 'Original',
  description: '', position: 'a0', createdAt: 0, updatedAt: 0,
}

const snapshot: BoardSnapshot = { board, columns: [col1], cards: [card1] }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let store: ReturnType<typeof makeStore>

beforeEach(() => {
  store = makeStore()
  store.getState().hydrate(snapshot)
})

// ---------------------------------------------------------------------------
// applyServerDelta — applied when no conflict
// ---------------------------------------------------------------------------

describe('applyServerDelta', () => {
  it('applies SET_CARD delta when no pending mutation conflicts', () => {
    const updated: Card = { ...card1, title: 'Updated by remote', seqNo: 1 }

    store.getState().applyServerDelta({ type: 'SET_CARD', card: updated, seqNo: 1 })

    expect(store.getState().cards['c1'].title).toBe('Updated by remote')
    expect(store.getState().lastSeqNo).toBe(1)
  })

  it('applies DELETE_CARD delta when no pending mutation conflicts', () => {
    store.getState().applyServerDelta({
      type: 'DELETE_CARD', cardId: 'c1', columnId: 'col1', seqNo: 1,
    })

    expect(store.getState().cards['c1']).toBeUndefined()
    expect(store.getState().cardOrder['col1']).not.toContain('c1')
    expect(store.getState().lastSeqNo).toBe(1)
  })

  it('applies SET_COLUMN delta when no pending mutation conflicts', () => {
    const updated: Column = { ...col1, title: 'Renamed by remote', seqNo: 1 }

    store.getState().applyServerDelta({ type: 'SET_COLUMN', column: updated, seqNo: 1 })

    expect(store.getState().columns['col1'].title).toBe('Renamed by remote')
    expect(store.getState().lastSeqNo).toBe(1)
  })

  // ---------------------------------------------------------------------------
  // applyServerDelta — skipped when conflicting pending mutation exists
  // ---------------------------------------------------------------------------

  it('skips SET_CARD delta when a pending mutation targets the same card', () => {
    // Enqueue an optimistic rename — creates a 'pending' mutation for c1
    store.getState().optimisticRenameCard({ cardId: 'c1', title: 'Optimistic' })

    const remote: Card = { ...card1, title: 'Remote value', seqNo: 1 }
    store.getState().applyServerDelta({ type: 'SET_CARD', card: remote, seqNo: 1 })

    // Optimistic value must be preserved; remote delta must be ignored
    expect(store.getState().cards['c1'].title).toBe('Optimistic')
    // lastSeqNo must NOT advance — the delta was dropped
    expect(store.getState().lastSeqNo).toBe(0)
  })

  it('skips DELETE_CARD delta when a pending mutation targets the same card', () => {
    store.getState().optimisticRenameCard({ cardId: 'c1', title: 'Optimistic' })

    store.getState().applyServerDelta({
      type: 'DELETE_CARD', cardId: 'c1', columnId: 'col1', seqNo: 1,
    })

    // Card must still exist (optimistic mutation in flight)
    expect(store.getState().cards['c1']).toBeDefined()
    expect(store.getState().lastSeqNo).toBe(0)
  })

  // ---------------------------------------------------------------------------
  // applyServerDelta — stale delta rejected by seqNo
  // ---------------------------------------------------------------------------

  it('rejects a stale delta whose seqNo is below lastSeqNo', () => {
    // Apply a fresh delta first to advance lastSeqNo
    const fresh: Card = { ...card1, title: 'Fresh', seqNo: 5 }
    store.getState().applyServerDelta({ type: 'SET_CARD', card: fresh, seqNo: 5 })

    expect(store.getState().lastSeqNo).toBe(5)

    // Now attempt to apply an older delta
    const stale: Card = { ...card1, title: 'Stale', seqNo: 3 }
    store.getState().applyServerDelta({ type: 'SET_CARD', card: stale, seqNo: 3 })

    // State and seqNo must be unchanged
    expect(store.getState().cards['c1'].title).toBe('Fresh')
    expect(store.getState().lastSeqNo).toBe(5)
  })

  it('rejects a delta with seqNo equal to lastSeqNo (not strictly greater)', () => {
    const first: Card = { ...card1, title: 'First', seqNo: 2 }
    store.getState().applyServerDelta({ type: 'SET_CARD', card: first, seqNo: 2 })

    const duplicate: Card = { ...card1, title: 'Duplicate', seqNo: 2 }
    store.getState().applyServerDelta({ type: 'SET_CARD', card: duplicate, seqNo: 2 })

    expect(store.getState().cards['c1'].title).toBe('First')
    expect(store.getState().lastSeqNo).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// hydrate with rebasePending
// ---------------------------------------------------------------------------

describe('hydrate rebasePending', () => {
  it('re-applies a pending rename on top of the fresh snapshot', () => {
    // Optimistically rename c1 — creates a pending mutation
    store.getState().optimisticRenameCard({ cardId: 'c1', title: 'Offline Rename' })
    expect(store.getState().cards['c1'].title).toBe('Offline Rename')

    // Simulate reconnect: fresh snapshot reverts to server title
    store.getState().hydrate(snapshot, true)

    // Rebase must re-apply the pending rename on top
    expect(store.getState().cards['c1'].title).toBe('Offline Rename')
    // Pending mutation is still in the queue (not yet confirmed by server)
    expect(store.getState().pendingMutationIds).toHaveLength(1)
  })

  it('applies multiple pending mutations in insertion order', () => {
    const col2: Column = {
      id: 'col2', boardId: 'b1', title: 'Done',
      position: 'b0', createdAt: 0, updatedAt: 0,
    }
    const snapshotWith2Cols: BoardSnapshot = { board, columns: [col1, col2], cards: [card1] }
    store.getState().hydrate(snapshotWith2Cols)

    // Two pending mutations: rename then move to col2
    store.getState().optimisticRenameCard({ cardId: 'c1', title: 'Offline Rename' })
    store.getState().optimisticMoveCard({ cardId: 'c1', toColumnId: 'col2', newPosition: 'a0' })

    expect(store.getState().cards['c1'].title).toBe('Offline Rename')
    expect(store.getState().cards['c1'].columnId).toBe('col2')

    // Reconnect: fresh snapshot shows original state
    store.getState().hydrate(snapshotWith2Cols, true)

    // Both mutations must be re-applied in order: rename first, then move
    expect(store.getState().cards['c1'].title).toBe('Offline Rename')
    expect(store.getState().cards['c1'].columnId).toBe('col2')
    expect(store.getState().cardOrder['col2']).toContain('c1')
    expect(store.getState().cardOrder['col1']).not.toContain('c1')
  })

  it('does NOT re-apply mutations when rebasePending is false (default)', () => {
    store.getState().optimisticRenameCard({ cardId: 'c1', title: 'Offline Rename' })
    expect(store.getState().cards['c1'].title).toBe('Offline Rename')

    // Plain hydrate (no rebase) — pending mutations are wiped by the snapshot
    store.getState().hydrate(snapshot)

    // Server title wins; the optimistic rename is gone
    expect(store.getState().cards['c1'].title).toBe('Original')
  })
})
