"use client";

// ---------------------------------------------------------------------------
// BoardCanvas — horizontally scrollable column list with drag-and-drop.
//
// DND ARCHITECTURE (Phase 1):
//   DragProvider  wraps the whole canvas; holds activeCardId in React context
//                 (NOT Zustand — per CLAUDE.md rule).
//   DndContext    sits inside DragProvider; owns sensors + collision detection.
//   SortableContext per column (in Column.tsx) defines each column's item set.
//   SortableCard  (in Card/) wraps each card with useSortable.
//   DragOverlay   renders the floating ghost using the base Card component
//                 (no sortable context → no re-render cascade).
//
//   onDragEnd is the ONLY place Zustand is written during a drag.
//   The new fractional position is computed from the post-drop neighbor
//   positions then passed to optimisticMoveCard.
//
// Phase 2: add column reordering by wrapping columnOrder in a horizontal
//   SortableContext here, adding SortableColumn wrappers, and handling
//   the MOVE_COLUMN case in onDragEnd.
// Phase 2: mount <CursorOverlay /> as a sibling to the column list,
//   absolutely positioned, pointer-events-none.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { nanoid } from "nanoid";
import { useShallow } from "zustand/shallow";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useBoardStore } from "@/store";
import { mutate } from "@/store/mutationQueue";
import { Column } from "./Column/Column";
import { Card } from "./Card/Card";
import { DragProvider, useDragContext } from "./DragContext";
import { positionBetween } from "@/lib/fractionalIndex";

// ---------------------------------------------------------------------------
// Inner component — needs DragProvider above it to call useDragContext.
// ---------------------------------------------------------------------------

function BoardCanvasContent() {
  const columnOrder = useBoardStore(useShallow((s) => s.columnOrder));
  const pendingCount = useBoardStore(
    (s) =>
      Object.values(s.pendingMutations).filter((m) => m.status === "pending")
        .length,
  );
  // cards / cardOrder / columns are NOT subscribed at render level.
  // handleDragEnd and handleAddColumn read them via getState() at call time —
  // a remote card update must not re-render the entire canvas (Phase 2 concern).

  const { activeCardId, setActiveCardId } = useDragContext();

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  // Require 8px of movement before a drag starts. This lets short taps fire
  // onClick (card selection) without triggering the sort interaction.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ---- Drag handlers -------------------------------------------------------

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    console.log("event log here", event);
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) return;

    // Read fresh state at drop time — not from a render-time closure.
    // This avoids stale snapshots in Phase 2 when remote deltas arrive mid-drag.
    const { cards, cardOrder } = useBoardStore.getState();
    console.log("cards and cardOrder here", cards, cardOrder);

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCard = cards[activeId];
    if (!activeCard) return;

    const fromColumnId = activeCard.columnId;

    // Use the annotated type field set on useDroppable/useSortable — robust
    // against ID collisions and future droppable types (e.g. swimlanes).
    const isOverColumn = over.data.current?.type === "column";
    const toColumnId = isOverColumn ? overId : cards[overId]?.columnId;
    if (!toColumnId) return;

    const targetOrder = cardOrder[toColumnId] ?? [];
    let newPosition: string;

    if (isOverColumn) {
      // Dropped on the column container itself (empty column or below all cards).
      const lastPos =
        targetOrder.length > 0
          ? (cards[targetOrder[targetOrder.length - 1]]?.position ?? null)
          : null;
      newPosition = positionBetween(lastPos, null);
    } else {
      const overIndex = targetOrder.indexOf(overId);

      if (fromColumnId === toColumnId) {
        // Same-column reorder: arrayMove → read neighbors in new order.
        const fromIndex = targetOrder.indexOf(activeId);
        const newOrder = arrayMove(targetOrder, fromIndex, overIndex);
        const newIdx = newOrder.indexOf(activeId);
        const before =
          newIdx > 0 ? (cards[newOrder[newIdx - 1]]?.position ?? null) : null;
        const after =
          newIdx < newOrder.length - 1
            ? (cards[newOrder[newIdx + 1]]?.position ?? null)
            : null;
        newPosition = positionBetween(before, after);
      } else {
        // Cross-column: insert before the card the pointer is over.
        const before =
          overIndex > 0
            ? (cards[targetOrder[overIndex - 1]]?.position ?? null)
            : null;
        const after = cards[targetOrder[overIndex]]?.position ?? null;
        newPosition = positionBetween(before, after);
      }
    }

    mutate.moveCard({ cardId: activeId, toColumnId, newPosition });
  }

  // ---- Add column ----------------------------------------------------------

  const handleAddColumn = () => {
    const title = newColTitle.trim();
    if (!title) return;
    const lastColId = columnOrder[columnOrder.length - 1];
    const lastPos = lastColId
      ? (useBoardStore.getState().columns[lastColId]?.position ?? null)
      : null;
    mutate.addColumn({
      column: {
        id: nanoid(),
        boardId: "board-1",
        title,
        position: positionBetween(lastPos, null),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    setNewColTitle("");
    setAddingColumn(false);
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
      {/* Dev-only pending mutations badge */}
      {pendingCount > 0 && (
        <div className="absolute right-4 top-3 z-10">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 shadow-sm dark:bg-amber-950 dark:text-amber-300">
            {pendingCount} pending
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCardId(null)}
      >
        {/* Phase 2: wrap columnOrder in a horizontal SortableContext here
            and add SortableColumn wrappers for column reordering. */}
        <div className="flex h-full items-start gap-5 px-8 py-6">
          {columnOrder.map((columnId) => (
            <Column key={columnId} columnId={columnId} />
          ))}

          {/* Add column */}
          <div className="mt-12 w-72 shrink-0">
            {addingColumn ? (
              <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                <input
                  autoFocus
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setAddingColumn(false);
                      setNewColTitle("");
                    }
                  }}
                  placeholder="Column name…"
                  className="rounded-lg border border-primary bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="flex-1 rounded-lg bg-linear-to-br from-primary to-primary-dim py-1.5 text-xs font-semibold text-on-primary transition-opacity hover:opacity-90"
                  >
                    Add column
                  </button>
                  <button
                    onClick={() => {
                      setAddingColumn(false);
                      setNewColTitle("");
                    }}
                    className="rounded-lg border border-outline-variant/20 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingColumn(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <PlusIcon />
                Add Column
              </button>
            )}
          </div>
        </div>

        {/* DragOverlay renders in a portal outside the column tree.
            Uses the base Card (not SortableCard) — no sortable context
            means no dnd-kit re-render cascade while the ghost is airborne.
            w-72 gives the card a proper width context (matches column width). */}
        <DragOverlay>
          {activeCardId && (
            <div className="w-72 rotate-1 opacity-90 drop-shadow-xl">
              <Card cardId={activeCardId} index={0} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — DragProvider must be above BoardCanvasContent so that
// useDragContext() resolves correctly.
// ---------------------------------------------------------------------------

export function BoardCanvas() {
  return (
    <DragProvider>
      <BoardCanvasContent />
    </DragProvider>
  );
}

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
