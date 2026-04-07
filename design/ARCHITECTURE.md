# FlowBoard Architecture — State Management Deep Dive

This document explains how FlowBoard's state layer works end-to-end, written for a developer who is new to Zustand but comfortable with TypeScript and React.

---

## 1. What Zustand is (and is not)

Zustand is a state management library. It is not tied to React's component tree the way Context is — the store lives **outside** any component, as a module-level singleton. Components subscribe to it, but the store exists and can be written to whether or not any component is mounted.

**The one-line mental model:**

```
store = { state } + { actions that mutate state }
```

Everything lives in one plain JavaScript object. Mutations are synchronous. React re-renders happen automatically for components that subscribed to the changed slice.

### Comparison to Redux

| Redux | Zustand |
|---|---|
| Separate reducers, actions, action creators | Actions are just functions on the store object |
| `dispatch({ type: 'ADD_CARD', payload })` | `useBoardStore.getState().optimisticAddCard(payload)` |
| Immutability via return value | Immutability via Immer (mutate a draft directly) |
| Requires a Provider wrapping your app | No Provider required — store is a module singleton |
| DevTools built-in | DevTools via `devtools` middleware |

---

## 2. How the store is created

### `store/index.ts`

```ts
export const useBoardStore = create<StoreState>()(
  devtools(
    immer((set) => ({
      ...createBoardSlice(set),
      ...createUISlice(set),
    })),
    { name: 'FlowBoard' }
  )
)
```

Three layers here:

1. **`create<StoreState>()`** — Zustand's factory. It takes a function that receives `set` (and `get`) and returns the initial state + actions object. The return type is a React hook (`useBoardStore`).

2. **`immer(...)` middleware** — Wraps `set` so that every call to `set(draft => ...)` gives you a mutable `draft` copy of the state. You mutate it directly (`draft.cards[id].title = 'new'`). Immer creates a new immutable state object behind the scenes. Without Immer you'd have to write `set(s => ({ ...s, cards: { ...s.cards, [id]: { ...s.cards[id], title: 'new' } } }))` — verbose and error-prone for nested objects.

3. **`devtools(...)` middleware** — Connects to the Redux DevTools browser extension. Every `set` call appears as a named action you can inspect, replay, or time-travel. The `name: 'FlowBoard'` label is what shows in the DevTools panel.

### Slice pattern

The store is split into `boardSlice` (all board data) and `uiSlice` (modal/menu state). Each slice is a factory function that takes `set` and returns its piece of the store object. They are spread together in `index.ts`. This pattern scales well — adding a `presenceSlice` in Phase 2 is one line.

---

## 3. Reading state in components

### The `useBoardStore` hook

```ts
// Read a single value
const title = useBoardStore(s => s.cards[cardId]?.title)

// Read multiple values (must use useShallow to avoid unnecessary re-renders)
const { columns, columnOrder } = useBoardStore(useShallow(s => ({
  columns: s.columns,
  columnOrder: s.columnOrder,
})))

// Read an action (actions are just functions on the store)
const hydrate = useBoardStore(s => s.hydrate)
```

When you call `useBoardStore(selector)`, React subscribes this component to the store. Whenever any `set()` call runs, Zustand re-runs your selector and **compares** the result to the previous result. If different, the component re-renders.

### `useShallow` — what it does and why you need it

Without `useShallow`, the comparison is `===` (reference equality). If your selector returns a new object or array literal `{ a, b }` on every call, `===` always says "different" and the component re-renders on every store change — even unrelated ones.

`useShallow` does a **shallow comparison** of the object's keys instead. `{ a: 1, b: 2 }` is considered equal to `{ a: 1, b: 2 }` even if they are different object instances.

```ts
// Re-renders on EVERY store change — columnOrder is a new array reference each time
const columnOrder = useBoardStore(s => s.columnOrder)

// Only re-renders when columnOrder values actually change
const columnOrder = useBoardStore(useShallow(s => s.columnOrder))
```

### Reading state outside components — `getState()`

Inside event handlers (like `handleDragEnd`), you do **not** call the hook. Instead:

```ts
const { cards, cardOrder } = useBoardStore.getState()
```

This reads the current store state directly, synchronously, without subscribing to anything. This is the right pattern in:
- Event handlers in `BoardCanvas` (drag, click)
- `mutationQueue.ts` (before/after API calls)
- Any non-component code

Why not subscribe at render level and use the value from the closure? Because drag events run at 60fps. If `cards` were a render-time subscription in `BoardCanvasContent`, every remote card update would trigger a full re-render of the canvas. `getState()` reads fresh data at call time with zero re-render cost.

---

## 4. The store shape — why flat maps

```ts
// What the store holds
cards:      Record<string, Card>      // { "card-1": Card, "card-2": Card, ... }
columns:    Record<string, Column>    // { "col-1": Column, ... }
cardOrder:  Record<string, string[]>  // { "col-1": ["card-2", "card-1"], ... }
columnOrder: string[]                 // ["col-1", "col-3", "col-2"]
```

Cards are NOT nested inside columns. This matters for two reasons:

**1. Selector memoization.** A `CardComponent` subscribes only to `s.cards[cardId]`. When card A moves to a different column, only card A's component re-renders — not every card in the board. If cards were nested inside column arrays, any card movement would produce a new column array reference, re-rendering every card in that column.

**2. O(1) lookups.** `cards["card-5"]` is instant. Finding card 5 in a nested structure requires scanning.

`cardOrder` and `columnOrder` are derived indices — they are built from fractional positions when the snapshot loads (`hydrate`), and updated incrementally on each mutation. They are never stored in the database.

---

## 5. The `_apply*` helper pattern

Every state transition has a private helper:

```ts
function _applyMoveCard(draft, payload) { ... }
function _applyAddCard(draft, card)     { ... }
function _applyDeleteCard(draft, id)    { ... }
// ...and so on for all 8 mutation types
```

These functions take an Immer `draft` and mutate it. They are the **single implementation** of each transition. They are called from two places:

1. **`optimistic*` actions** — immediately when the user acts
2. **`_applyInverse`** — when rolling back a failed mutation
3. **`applyServerDelta` (Phase 2)** — when a real-time delta arrives

The rule: if you find a bug in "move card" logic, fix it in `_applyMoveCard` and it is fixed everywhere. There is no risk of the optimistic path and the rollback path diverging.

---

## 6. Mutations — the complete flow

This is the most important part. Every user action (add card, rename, move, delete) goes through the same pipeline:

```
Component
  → mutate.addCard(payload)          [store/mutationQueue.ts]
    → optimisticAddCard(payload)     [store/boardSlice.ts]   ← UI updates here
    → api.addCard(card)              [lib/api.ts]            ← REST call
    → confirmMutation(id)            [store/boardSlice.ts]   ← on success
      OR rollbackMutation(id)                                ← on failure
```

### `store/mutationQueue.ts` — the orchestrator

```ts
async function withOptimistic(
  optimisticFn: () => string,   // calls the store action, returns mutation ID
  apiFn: () => Promise<unknown>, // fires the REST call
  label: string,                 // for error logging
): Promise<void> {
  const mutId = optimisticFn()  // 1. Update UI instantly

  try {
    await apiFn()                           // 2. Call the server
    useBoardStore.getState().confirmMutation(mutId)   // 3a. Success
  } catch (err) {
    console.error(`[mutate] ${label} failed — rolling back`, err)
    useBoardStore.getState().rollbackMutation(mutId)  // 3b. Failure
  }
}
```

`optimisticFn` is called **synchronously** — the UI reflects the change before `await apiFn()` even starts. The user sees the result instantly. The server call happens in the background.

Each `mutate.*` entry is just a call to `withOptimistic` with the right pair of functions:

```ts
export const mutate = {
  addCard: (payload) => withOptimistic(
    () => useBoardStore.getState().optimisticAddCard(payload),
    () => api.addCard(payload.card),
    'addCard',
  ),
  // ...same pattern × 8
}
```

### `store/boardSlice.ts` — optimistic actions

Each `optimistic*` action does two things in a single `set()` call:

```ts
optimisticMoveCard: (payload) => {
  const mutId = nanoid()   // pre-generate ID so we own it before set() runs

  set(draft => {
    const card = draft.cards[payload.cardId]

    // 1. Capture the inverse — what to do if we need to undo this
    const inverse: InverseOperation = {
      type: 'MOVE_CARD',
      payload: {
        cardId:      payload.cardId,
        toColumnId:  card.columnId,    // current column = where to put it back
        newPosition: card.position,    // current position = what to restore
      },
    }

    // 2. Apply the change immediately
    _applyMoveCard(draft, payload)

    // 3. Record the mutation and its inverse in the pending queue
    _enqueue(draft, 'MOVE_CARD', inverse, payload.cardId, mutId)
  })

  return mutId  // mutationQueue needs this ID to confirm/rollback later
}
```

The inverse operation captures **only what changed**. For a move, that is the original column and position. Not a full card snapshot. This matters for rollback correctness (see section 8).

---

## 7. The pending mutation queue

```ts
pendingMutations:   Record<string, PendingMutation>  // ID → mutation record
pendingMutationIds: string[]                          // ordered list of IDs
```

Why both? `pendingMutations` is a map for O(1) lookup by ID. `pendingMutationIds` is an array that preserves insertion order — rollbacks must happen in reverse order if multiple mutations touch the same entity.

A `PendingMutation` looks like:

```ts
{
  id: "abc123",
  type: "MOVE_CARD",
  entityId: "card-5",          // which entity this mutation touches
  enqueuedAt: 1712345678000,
  status: "pending",           // → "confirmed" on success, deleted on rollback
  inverseOperation: {
    type: "MOVE_CARD",
    payload: { cardId: "card-5", toColumnId: "col-1", newPosition: "a0" }
  }
}
```

### `confirmMutation`

```ts
confirmMutation: (mutationId) => {
  set(draft => {
    draft.pendingMutations[mutationId].status = 'confirmed'  // mark, don't delete
    _pruneConfirmed(draft)
  })
}
```

Why not delete immediately? If a later mutation on the same entity is still pending and then fails, `rollbackMutation` needs to know that this earlier mutation already succeeded. Deleting it would lose that information. `_pruneConfirmed` removes confirmed mutations from the **front** of the queue only once no pending mutations precede them.

### `rollbackMutation`

```ts
rollbackMutation: (mutationId) => {
  set(draft => {
    const mutation = draft.pendingMutations[mutationId]
    const mutIdx   = draft.pendingMutationIds.indexOf(mutationId)

    // Check if any LATER mutation on the same entity was already confirmed
    const skipInverse = draft.pendingMutationIds
      .slice(mutIdx + 1)
      .some(id => {
        const m = draft.pendingMutations[id]
        return m?.status === 'confirmed' && m.entityId === mutation.entityId
      })

    if (!skipInverse) {
      _applyInverse(draft, mutation.inverseOperation)  // undo the change
    }
    // skipInverse === true means a later confirmed mutation already moved
    // this entity to a server-known state. Applying the inverse would put
    // us behind the server. Leave it and let Phase 2 reconcile.

    delete draft.pendingMutations[mutationId]
    draft.pendingMutationIds = draft.pendingMutationIds.filter(id => id !== mutationId)
    _pruneConfirmed(draft)
  })
}
```

---

## 8. The rollback problem — and why inverse ops beat snapshots

### The naive approach — full snapshots

You could store the entire card object before each mutation and restore it on rollback. Simple, but wrong under concurrent mutations:

```
t=0  card X is in col-A, position "a0"
t=1  mutation M1: move X to col-B       snapshot₁ = { columnId: "col-A", position: "a0" }
t=2  mutation M2: move X to col-C       snapshot₂ = { columnId: "col-B", position: "b0" }
t=3  M2 confirmed
t=4  M1 fails — rollback M1
     Restore snapshot₁ → card X is now in col-A, position "a0"
     But M2 was confirmed! Server has X in col-C.
     Client is now behind server state. Data corruption.
```

### The inverse operation approach

Instead of snapshots, each mutation stores the minimal operation to undo **just its own change**. M1's inverse is "move X back to col-A, position a0". M2's inverse is "move X back to col-B, position b0".

When M1 fails and M2 was already confirmed, `rollbackMutation` detects this (`skipInverse` check) and skips the inverse entirely. The entity stays where M2 put it. No data corruption.

When M1 fails and M2 is still pending, applying M1's inverse is safe — it restores X to col-A, and if M2 later fails, its inverse restores X to col-B... but wait, col-B is where M1 had put it. This is why the **order matters** — rollbacks must happen in reverse enqueue order, not arbitrarily.

---

## 9. `hydrate` — loading server data

```ts
hydrate: (snapshot, rebasePending = false) => {
  set(draft => {
    // 1. Convert arrays → flat maps
    draft.cards   = Object.fromEntries(snapshot.cards.map(c => [c.id, c]))
    draft.columns = Object.fromEntries(snapshot.columns.map(c => [c.id, c]))

    // 2. Build sorted order indices from fractional positions
    draft.columnOrder = snapshot.columns
      .sort((a, b) => comparePositions(a.position, b.position))
      .map(c => c.id)

    draft.cardOrder = {}
    for (const col of snapshot.columns) {
      draft.cardOrder[col.id] = snapshot.cards
        .filter(card => card.columnId === col.id)
        .sort((a, b) => comparePositions(a.position, b.position))
        .map(card => card.id)
    }

    // 3. Phase 2 stub — re-apply pending mutations after reconnect
    if (rebasePending) { /* TODO */ }
  })
}
```

`hydrate` is called once on page load. It takes the server snapshot (arrays) and converts it into the flat map structure the store uses. The `rebasePending` flag is a stub for Phase 2: after a WebSocket reconnect, the server sends a fresh snapshot, but any in-flight optimistic mutations need to be re-applied on top of it so they are not silently discarded.

---

## 10. Full data flow diagram

```
User clicks "Add Card"
        │
        ▼
  Column.tsx
  mutate.addCard({ card: { id, columnId, title, ... } })
        │
        ▼
  mutationQueue.ts — withOptimistic()
  ┌─────────────────────────────────────────────┐
  │  1. optimisticFn()                           │
  │     → boardSlice.optimisticAddCard(payload)  │  ← synchronous
  │       → _applyAddCard(draft, card)           │     UI updates here
  │       → _enqueue(draft, 'ADD_CARD', inverse) │
  │       → returns mutId                        │
  │                                              │
  │  2. await api.addCard(card)                  │  ← async REST call
  │     POST /api/boards/board-1/cards           │
  │                                              │
  │  3a. SUCCESS                                 │
  │      confirmMutation(mutId)                  │
  │      → mut.status = 'confirmed'              │
  │      → _pruneConfirmed()                     │
  │                                              │
  │  3b. FAILURE                                 │
  │      rollbackMutation(mutId)                 │
  │      → check skipInverse                     │
  │      → _applyInverse(draft, inverse)         │  ← UI reverts
  │      → remove from queue                     │
  └─────────────────────────────────────────────┘
        │
        ▼
  React re-renders only components subscribed
  to the changed slice (the new card's column)
```

---

## 11. Key files at a glance

| File | Role |
|---|---|
| [store/index.ts](../store/index.ts) | Assembles slices + middleware, exports `useBoardStore` hook |
| [store/boardSlice.ts](../store/boardSlice.ts) | All board data + optimistic actions + rollback logic |
| [store/uiSlice.ts](../store/uiSlice.ts) | Ephemeral UI state (open menus, inline forms) |
| [store/mutationQueue.ts](../store/mutationQueue.ts) | Orchestrates optimistic → API → confirm/rollback for every mutation |
| [lib/api.ts](../lib/api.ts) | Typed REST client — the only file that calls `fetch` |
| [types/mutations.ts](../types/mutations.ts) | `PendingMutation`, `InverseOperation`, all payload types |
| [types/board.ts](../types/board.ts) | `Card`, `Column`, `Board`, `BoardSnapshot` |
| [lib/fractionalIndex.ts](../lib/fractionalIndex.ts) | `positionBetween`, `comparePositions` — conflict-safe ordering |
| [components/board/DragContext.tsx](../components/board/DragContext.tsx) | React context for drag state (never Zustand — see CLAUDE.md) |
