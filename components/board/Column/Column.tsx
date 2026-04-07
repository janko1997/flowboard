'use client'

// ---------------------------------------------------------------------------
// Column — transparent container; tonal depth comes from card backgrounds
// sitting against the surface canvas, not from column borders or fills.
//
// Header:   uppercase tracking-wider label + count badge + hover-reveal menu
// Cards:    vertically scrollable, gap-4 between cards (design spec)
// Add Card: always-visible dashed-border button at column bottom
// ---------------------------------------------------------------------------

import { memo, useCallback, useState } from 'react'
import { nanoid } from 'nanoid'
import { useShallow } from 'zustand/shallow'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '@/store'
import { mutate } from '@/store/mutationQueue'
import { SortableCard } from '../Card/SortableCard'
import { positionBetween } from '@/lib/fractionalIndex'

interface ColumnProps {
  columnId: string
}

function ColumnComponent({ columnId }: ColumnProps) {
  const column = useBoardStore(useShallow(
    useCallback((s) => s.columns[columnId], [columnId])
  ))
  const cardIds = useBoardStore(useShallow(
    useCallback((s) => s.cardOrder[columnId] ?? [], [columnId])
  ))

  const cards             = useBoardStore(s => s.cards)
  const addingToColumnId  = useBoardStore(s => s.addingCardToColumnId)
  const setAddingToColumn = useBoardStore(s => s.setAddingCardToColumn)

  const [newCardTitle, setNewCardTitle] = useState('')
  const isAddingHere = addingToColumnId === columnId

  // Make this column a drop target so dragging onto an empty column works.
  // closestCorners will prefer a card over the column when cards are present.
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: columnId, data: { type: 'column' } })

  if (!column) return null

  const handleAddCard = () => {
    const title = newCardTitle.trim()
    if (!title) return
    const lastPos = cardIds.length > 0 ? (cards[cardIds[cardIds.length - 1]]?.position ?? null) : null
    mutate.addCard({
      card: {
        id: nanoid(), columnId, title, description: '',
        position: positionBetween(lastPos, null),
        createdAt: Date.now(), updatedAt: Date.now(),
      },
    })
    setNewCardTitle('')
    setAddingToColumn(null)
  }

  return (
    <div data-column-id={columnId} className="group flex w-72 shrink-0 flex-col">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {column.title}
          </h3>
          <span className="rounded bg-surface-container-highest px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
            {cardIds.length}
          </span>
        </div>
        <ColumnMenuButton columnId={columnId} />
      </div>

      {/* Card list — SortableContext defines the ordered set for dnd-kit.
          setDropRef makes the container a drop target for empty-column drops.
          isOver adds a subtle tint so the user sees where the card will land. */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          className={[
            'flex flex-1 flex-col gap-4 overflow-y-auto pb-2 transition-colors duration-150',
            isOver && cardIds.length === 0 ? 'rounded-xl bg-primary/5' : '',
          ].join(' ')}
        >
          {cardIds.map((cardId, index) => (
            <SortableCard key={cardId} cardId={cardId} index={index} />
          ))}
        </div>
      </SortableContext>

      {/* Add card */}
      <div className="mt-4">
        {isAddingHere ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() }
                if (e.key === 'Escape') { setAddingToColumn(null); setNewCardTitle('') }
              }}
              placeholder="Card title…"
              rows={2}
              className="w-full resize-none rounded-xl border border-primary bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                className="flex-1 rounded-lg bg-linear-to-br from-primary to-primary-dim py-1.5 text-xs font-semibold text-on-primary transition-opacity hover:opacity-90"
              >
                Add card
              </button>
              <button
                onClick={() => { setAddingToColumn(null); setNewCardTitle('') }}
                className="rounded-lg border border-outline-variant/20 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingToColumn(columnId)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-2 text-xs font-semibold text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary"
          >
            <PlusIcon />
            Add Card
          </button>
        )}
      </div>
    </div>
  )
}

export const Column = memo(ColumnComponent)
Column.displayName = 'Column'

// ---------------------------------------------------------------------------
// ColumnMenuButton — hidden until column group-hover
// ---------------------------------------------------------------------------

function ColumnMenuButton({ columnId }: { columnId: string }) {
  const [renaming, setRenaming]       = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const column      = useBoardStore(s => s.columns[columnId])
  const openMenuId  = useBoardStore(s => s.openColumnMenuId)
  const setOpenMenu = useBoardStore(s => s.openColumnMenu)

  const isOpen = openMenuId === columnId

  const submitRename = () => {
    const title = renameValue.trim()
    if (title && title !== column?.title) mutate.renameColumn({ columnId, title })
    setRenaming(false)
    setOpenMenu(null)
  }

  if (renaming) {
    return (
      <input
        autoFocus
        defaultValue={column?.title}
        onChange={e => setRenameValue(e.target.value)}
        onBlur={submitRename}
        onKeyDown={e => {
          if (e.key === 'Enter')  submitRename()
          if (e.key === 'Escape') { setRenaming(false); setOpenMenu(null) }
        }}
        className="w-full rounded border border-primary bg-surface-container-lowest px-2 py-0.5 text-sm font-bold uppercase tracking-wider text-on-surface-variant focus:outline-none"
      />
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpenMenu(isOpen ? null : columnId)}
        className="rounded p-1 text-on-surface-variant opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-container-high"
        aria-label="Column options"
      >
        <DotsIcon />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
          <div className="absolute right-0 top-7 z-20 w-36 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest py-1 shadow-lg">
            <button
              onClick={() => { setRenameValue(column?.title ?? ''); setRenaming(true) }}
              className="flex w-full items-center px-3 py-2 text-xs text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Rename
            </button>
            <button
              onClick={() => { mutate.deleteColumn({ columnId }); setOpenMenu(null) }}
              className="flex w-full items-center px-3 py-2 text-xs text-error transition-colors hover:bg-error-container/20"
            >
              Delete column
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const DotsIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
