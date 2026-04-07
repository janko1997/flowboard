'use client'

// ---------------------------------------------------------------------------
// Card — renders a single FlowCard.
//
// DESIGN: "The Silent Architecture" FlowCard spec:
// - Background: surface-container-lowest (white / dark slate-800)
// - No border by default; ghost border (outline-variant/15) on hover
// - Selected state: ring-2 ring-primary (driven by uiSlice.selectedCardId)
// - Hover: shadow-md + ghost border — pure CSS, no Zustand state needed
// - Label chip, due date, assignee avatar are all optional
//
// PRESENCE SLOT: The assignee div at the bottom-right is structurally reserved
// for Phase 2's editing tooltip ("Alex is editing…"). Phase 1 shows a static
// InitialAvatar. Phase 2 wraps it with a Liveblocks presence check.
//
// RE-RENDERS: memo + scoped useCallback selector. Only re-renders when THIS
// card's updatedAt changes. Hover effects are pure CSS — zero Zustand reads.
// ---------------------------------------------------------------------------

import { memo, useCallback } from 'react'
import { useBoardStore } from '@/store'
import { LabelChip } from './LabelChip'
import { InitialAvatar } from '../ProjectHeader'

interface CardProps {
  cardId: string
  index: number
}

function CardComponent({ cardId, index }: CardProps) {
  const card       = useBoardStore(useCallback(s => s.cards[cardId], [cardId]))
  const isSelected = useBoardStore(useCallback(s => s.selectedCardId === cardId, [cardId]))
  const selectCard = useBoardStore(s => s.selectCard)

  if (!card) return null

  const formattedDate = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div
      data-card-id={cardId}
      role="button"
      tabIndex={0}
      aria-label={`Card: ${card.title}, position ${index + 1}`}
      onClick={() => selectCard(isSelected ? null : cardId)}
      onKeyDown={e => e.key === 'Enter' && selectCard(isSelected ? null : cardId)}
      className={[
        'group relative w-full max-w-62.5 cursor-pointer rounded-xl bg-surface-container-lowest p-4',
        'shadow-sm transition-all duration-150',
        'border border-transparent hover:border-outline-variant/15 hover:shadow-md hover:-translate-y-0.5',
        isSelected ? 'ring-2 ring-primary border-transparent!' : '',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      ].join(' ')}
    >
      {/* Drag handle — wired in drag-and-drop step */}
      <div
        className="absolute left-1.5 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-30"
        aria-hidden
      >
        <GripIcon />
      </div>

      {/* Label chip */}
      {card.label && (
        <div className="mb-3">
          <LabelChip label={card.label} />
        </div>
      )}

      {/* Card title */}
      <h4 className="mb-4 pl-1 text-sm font-semibold leading-snug text-on-surface">
        {card.title}
      </h4>

      {/* Bottom row: date + presence/assignee slot */}
      {(formattedDate || card.assigneeInitials) && (
        <div className="flex items-center justify-between">
          {formattedDate ? (
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <CalendarIcon />
              <span className="text-[11px] font-medium">{formattedDate}</span>
            </div>
          ) : (
            <div />
          )}

          {/* Presence slot — Phase 2: overlay editing tooltip here */}
          {card.assigneeInitials && (
            <InitialAvatar
              initials={card.assigneeInitials}
              hue={card.assigneeHue ?? 200}
              size={6}
            />
          )}
        </div>
      )}
    </div>
  )
}

export const Card = memo(CardComponent, (prev, next) => prev.cardId === next.cardId)
Card.displayName = 'Card'

const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const GripIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="text-on-surface-variant">
    <circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/>
    <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
    <circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/>
  </svg>
)
