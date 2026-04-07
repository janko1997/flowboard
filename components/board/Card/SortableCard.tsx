'use client'

// ---------------------------------------------------------------------------
// SortableCard — thin dnd-kit wrapper around the presentational Card.
//
// SEPARATION OF CONCERNS:
//   Card.tsx      — pure presentation, zero dnd-kit knowledge
//   SortableCard  — dnd-kit glue only; owns sortable node ref + drag attrs
//
// The original card slot shows opacity-0 while airborne; the DragOverlay
// in BoardCanvas renders the floating ghost using the base Card directly.
//
// ACTIVATION: PointerSensor with distance:8 (set in BoardCanvas) means a
// short tap triggers onClick (card selection) and only an intentional drag
// motion starts the sort. No special drag-handle wiring needed.
//
// Phase 2: no changes needed here. Column sortable wrappers follow the same
// pattern when column reordering is added.
// ---------------------------------------------------------------------------

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './Card'

interface SortableCardProps {
  cardId: string
  index: number
}

export function SortableCard({ cardId, index }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId, data: { type: 'card' } })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        // Hide the original slot while DragOverlay shows the ghost.
        // Keeps the column layout stable (slot stays in the DOM).
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <Card cardId={cardId} index={index} />
    </div>
  )
}
