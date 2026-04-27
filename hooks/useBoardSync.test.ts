import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Board, Card, Column } from '@/types/board'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/liveblocks', () => ({ useStorage: vi.fn() }))
vi.mock('@/store', () => ({ useBoardStore: vi.fn() }))
vi.mock('@/store/liveblocksChannel', () => ({ consumeLocalWrite: vi.fn(() => false) }))

import { useStorage } from '@/lib/liveblocks'
import { useBoardStore } from '@/store'
import { consumeLocalWrite } from '@/store/liveblocksChannel'
import { useBoardSync } from './useBoardSync'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBoard: Board = { id: 'b1', title: 'Test Board', createdAt: 0, updatedAt: 0 }

const card1: Card = {
  id: 'c1', columnId: 'col1', title: 'Card 1',
  description: '', position: 'a0', createdAt: 0, updatedAt: 0,
}
const card1v2: Card = { ...card1, title: 'Updated by remote', seqNo: 1 }

const col1: Column = {
  id: 'col1', boardId: 'b1', title: 'Col 1',
  position: 'a0', createdAt: 0, updatedAt: 0,
}

function makeStorage(cards: Card[] = [], columns: Column[] = []) {
  return {
    cards:   new Map(cards.map(c => [c.id, c])),
    columns: new Map(columns.map(c => [c.id, c])),
  }
}

// ---------------------------------------------------------------------------
// Store mock helper
// ---------------------------------------------------------------------------

function mockStore(opts: {
  board?: Board | null
  hydrate?: ReturnType<typeof vi.fn>
  applyServerDelta?: ReturnType<typeof vi.fn>
}) {
  const hydrate = opts.hydrate ?? vi.fn()
  const applyServerDelta = opts.applyServerDelta ?? vi.fn()
  const board = opts.board ?? null
  vi.mocked(useBoardStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sel: (s: any) => unknown) => sel({ hydrate, board, applyServerDelta })
  )
  return { hydrate, applyServerDelta }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBoardSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- Phase A: establishing the baseline ----------------------------------

  it('does not call hydrate or applyServerDelta before board is available', () => {
    const { hydrate, applyServerDelta } = mockStore({ board: null })
    vi.mocked(useStorage).mockReturnValue(makeStorage([card1], [col1]))

    renderHook(() => useBoardSync())

    expect(hydrate).not.toHaveBeenCalled()
    expect(applyServerDelta).not.toHaveBeenCalled()
  })

  it('never calls hydrate — REST is always the initial source of truth', () => {
    const { hydrate } = mockStore({ board: mockBoard })
    vi.mocked(useStorage).mockReturnValue(makeStorage([card1], [col1]))

    renderHook(() => useBoardSync())

    // hydrate must never be called from useBoardSync regardless of storage contents
    expect(hydrate).not.toHaveBeenCalled()
  })

  it('does not crash when storage is null (still loading)', () => {
    mockStore({ board: mockBoard })
    vi.mocked(useStorage).mockReturnValue(null)

    expect(() => renderHook(() => useBoardSync())).not.toThrow()
  })

  // ---- Phase B: delta sync -------------------------------------------------

  it('calls applyServerDelta for a new card entry (remote write)', () => {
    const { applyServerDelta } = mockStore({ board: mockBoard })
    const initial = makeStorage([], [])
    vi.mocked(useStorage).mockReturnValue(initial)

    const { rerender } = renderHook(() => useBoardSync())

    // Simulate a remote storage update: new card appears
    const updated = makeStorage([card1v2], [])
    vi.mocked(useStorage).mockReturnValue(updated)
    act(() => { rerender() })

    expect(applyServerDelta).toHaveBeenCalledOnce()
    expect(applyServerDelta).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_CARD', card: card1v2 })
    )
  })

  it('skips applyServerDelta when consumeLocalWrite returns true (own echo)', () => {
    vi.mocked(consumeLocalWrite).mockReturnValue(true) // our own write
    const { applyServerDelta } = mockStore({ board: mockBoard })
    vi.mocked(useStorage).mockReturnValue(makeStorage([], []))

    const { rerender } = renderHook(() => useBoardSync())

    vi.mocked(useStorage).mockReturnValue(makeStorage([card1v2], []))
    act(() => { rerender() })

    expect(applyServerDelta).not.toHaveBeenCalled()
  })

  it('does not call applyServerDelta when storage reference is unchanged', () => {
    const { applyServerDelta } = mockStore({ board: mockBoard })
    const storage = makeStorage([card1], [col1])
    vi.mocked(useStorage).mockReturnValue(storage)

    const { rerender } = renderHook(() => useBoardSync())

    // Same reference returned — no delta
    vi.mocked(useStorage).mockReturnValue(storage)
    act(() => { rerender() })

    expect(applyServerDelta).not.toHaveBeenCalled()
  })
})
