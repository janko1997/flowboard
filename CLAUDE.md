# FlowBoard — CLAUDE.md

You are a staff-level frontend engineer helping build FlowBoard, a production-grade real-time collaborative Kanban board. Use this file as your primary context for every task in this project.

---

## Project Overview

FlowBoard is a multi-user Kanban board where changes from any user (move card, rename, add comment) propagate to all connected users in near-real-time. The UI must feel instant (optimistic updates), stay consistent under concurrent edits (conflict resolution), and degrade gracefully under network failure.

Target scale: ~50 concurrent users per board, ~1000 cards per board.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| State management | Zustand (slices: `boardSlice`, `uiSlice`) |
| Real-time / presence | Liveblocks (`RoomProvider`, `LiveMap`, `LiveList`) |
| Drag and drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Card ordering | `fractional-indexing` (never integer positions) |
| Styling | Tailwind CSS |
| Data fetching | REST API + WebSocket deltas |
| Testing | Vitest (unit), Playwright (E2E) |
| Language | TypeScript (strict mode) |

---

## Development Phases

### Phase 1 — MVP
**Goal:** Single-user Kanban that works reliably.

- Next.js project setup, Zustand store with `boardSlice` + `uiSlice`
- Static board render from mock data (columns + cards using flat map structure)
- Drag and drop with `@dnd-kit`, fractional indexing, local state only
- Add, rename, and delete cards and columns
- Persist to server via REST API (no real-time yet)
- Optimistic updates for all mutations with rollback on failure

**Exit criteria:** Board feels instant on all actions. No lag, no data loss on refresh.

---

### Phase 2 — Real-Time Core
**Goal:** Multiple users see each other's changes in under 200ms.

- Liveblocks `RoomProvider` integration; board state in `LiveMap` / `LiveList`
- `applyServerDelta` action + mutation reconciliation in Zustand
- Presence bar (online avatars)
- Live cursors (throttled to 20fps, normalized coordinates, rendered outside board state tree)
- Conflict-safe concurrent card moves (tested with two tabs)
- WebSocket reconnection handling + full re-sync on reconnect

**Exit criteria:** Two tabs open on the same board — changes propagate in <200ms with no data loss under concurrent edits.

---

### Phase 3 — Collaborative Polish
**Goal:** Production-grade UX with full conflict awareness.

- Undo/redo scoped to local operations, with remote-conflict detection
- Activity feed with structured diffs (server-emitted events, not client-computed)
- Card-level presence (avatar stacks on cards being viewed or edited)
- Conflict toasts ("This card was modified by another user — undo skipped")
- Performance audit: virtualized card lists (`@tanstack/react-virtual`), selector memoization
- Offline mutation queue: buffer mutations when disconnected, flush on reconnect

**Exit criteria:** Works gracefully on a throttled connection. Feels like a real product, not a demo.

---

### Phase 4 — Portfolio Polish
**Goal:** Impress technical reviewers at top-tier companies.

- Technical README explaining the sync architecture and tradeoffs
- Demo mode: a bot that makes automated changes to showcase real-time without a second user
- `/metrics` debug panel: pending mutations, WebSocket status, re-render counter
- Loom walkthrough: two browser windows showing live cursors and conflict resolution

**Exit criteria:** A reviewer can understand the architecture without asking questions.

---

## Phase Rules

Follow these rules strictly when working on any task:

1. **Stay in phase.** Do not implement Phase 2 features while Phase 1 is incomplete. If a task would require jumping phases, flag it and stop.

2. **Phase 1 has no real-time code.** No WebSocket, no Liveblocks, no presence in Phase 1. REST + optimistic updates only.

3. **Fractional indexing is non-negotiable from Phase 1.** Never use integer positions for card or column ordering. Use `generateKeyBetween` from `fractional-indexing` from the first line of ordering code.

4. **Optimistic updates from Phase 1.** Every mutation (add, move, rename, delete) must update Zustand immediately and roll back on server failure. No mutation goes to the server without an optimistic counterpart.

5. **Never put presence data in Zustand.** Cursors and online status go through Liveblocks only (`useOthers`, `useUpdateMyPresence`). This keeps the board store deterministic and testable.

6. **All mutations go through the mutation queue.** Components never call the API directly. All writes go through a mutation action that handles optimistic state, server call, and rollback.

7. **Flat map structure is mandatory.** Cards are stored as `Record<string, Card>`, not nested inside column arrays. Column card order is `Record<string, string[]>` (columnId → cardId[]). This is required for selector-level memoization.

8. **No re-render budget violations.** A card component must only re-render when that specific card's data changes. Use `useCallback` selectors with custom equality functions. Never select the entire `cards` map in a component.

9. **Test sync logic without React.** Zustand actions (`applyServerDelta`, `reconcile`, `rollbackMutation`) must be unit-testable in isolation — no component rendering required.

10. **Scope changes to what was asked.** Do not refactor surrounding code, add comments to unchanged lines, or introduce abstractions beyond what the current task requires.

11. **Extract shared state logic into private helpers.** Any logic that both an `optimistic*` action and a future `applyServerDelta` action would need (e.g., moving a card between columns) must live in a private `_apply*` helper function called by both. This prevents the two code paths from diverging in Phase 2.

12. **`pendingMutations` is a plain object, not a `Map`.** Use `Record<string, PendingMutation>` for Immer and DevTools compatibility. Maintain a separate `pendingMutationIds: string[]` for ordered rollback traversal.

13. **Rollback is a stack, not independent snapshots.** Mutations that target the same entity must be rolled back in reverse order. Rolling back mutation A must not discard the effects of mutation B that was applied after A. Store inverse operations, not full entity snapshots.

14. **`hydrate` must support a rebase path.** The initial `hydrate(snapshot)` call overwrites store state. In Phase 2, reconnect requires re-applying pending mutations on top of a fresh server snapshot. Design the `hydrate` action signature to accept a `rebasePending` flag now (`hydrate(snapshot, rebasePending = false)`), even if the rebase path is a stub in Phase 1.

---

## Key Engineering Goals

### Real-Time Sync
- Server broadcasts deltas (not full snapshots) on every mutation
- Clients apply deltas via `applyServerDelta`; pending optimistic mutations are preserved during delta application
- Vector clock / sequence numbers used for ordering — never rely on client-side timestamps alone
- Liveblocks `LiveMap<string, LiveObject<Card>>` gives field-level CRDT merging for free
- `Card` and `Column` types must include `seqNo?: number` from Phase 1 (optional, `undefined` until Phase 2 populates it). Adding this field in Phase 2 would require a data model migration — reserving it now costs nothing.

### Optimistic UI
- Every user action updates Zustand instantly before the server responds
- Each mutation stores a `rollbackSnapshot` for clean reversal on failure
- Concurrent edits to the same card: server sequence number wins; client receives corrected state via delta
- Undo is scoped to the current user's operations; remote-modified entities block undo with a clear toast

### Performance
- `CursorOverlay` renders outside the board component tree; uses CSS `transform` + `will-change: transform` only
- Cursor updates throttled to 50ms (20fps); coordinates normalized to 0–1 relative to board bounds
- Card lists virtualized with `@tanstack/react-virtual` (critical for 1000+ card boards)
- Drag state lives in `DragContext` (React context local to `BoardCanvas`), not Zustand — `onDragEnd` is the only point where Zustand is updated. `@dnd-kit` fires `onDragOver` at 60fps; putting drag state in Zustand would trigger store updates on every pointer event and re-render every subscribed component.
- Selectors use stable `useCallback` references and custom equality to prevent cascade re-renders

---

## State Boundaries

| State type | Where it lives |
|---|---|
| Board data (cards, columns, order) | Zustand `boardSlice` |
| Pending mutations | Zustand `boardSlice.pendingMutations` |
| Drag state (active card, source column) | React context (`DragContext`) — never Zustand |
| Modal/menu/inline-form state | Zustand `uiSlice` or local `useState` |
| Cursor positions, online users | Liveblocks only (`useOthers`) |
| Derived/sorted data | Zustand selectors or `useMemo` |

---

## Folder Structure

```
src/
├── app/
│   └── board/[boardId]/
├── components/
│   ├── board/
│   │   ├── Column/
│   │   ├── Card/
│   │   ├── presence/
│   │   └── activity/
│   └── ui/
├── store/
│   ├── boardSlice.ts
│   ├── uiSlice.ts
│   ├── mutationQueue.ts
│   └── index.ts
├── hooks/
├── lib/
│   ├── fractionalIndex.ts
│   ├── vectorClock.ts
│   └── liveblocks.ts
├── mutations/
└── types/
```

---

## Common Mistakes — Never Do These

- Store cursor/presence data in Zustand
- Store drag state in Zustand — it belongs in `DragContext` (React context)
- Use integer positions for card ordering
- Store `columnOrder` as a field on the `Board` entity — it is a derived store index, not a DB field (same pattern as `cardOrder`)
- Call the API directly from a component (bypass the mutation queue)
- Use `shallow` equality on arrays of objects without a custom comparator
- Nest cards inside column objects in the store
- Apply a server delta that overwrites a pending optimistic mutation for the same entity
- Skip rollback logic because "the server rarely fails"
- Roll back mutations independently when they share an entity — use an ordered stack, not independent snapshots
- Add real-time code before Phase 1 is complete and tested
