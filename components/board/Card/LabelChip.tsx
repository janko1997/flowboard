import type { CardLabel } from '@/types/board'

// ---------------------------------------------------------------------------
// LabelChip — colored tag shown at the top of each card.
// Uses static color maps so Tailwind can statically detect class names.
// DO NOT build class names by string interpolation (Tailwind won't purge them).
// ---------------------------------------------------------------------------

const STYLES: Record<CardLabel['variant'], string> = {
  research:       'bg-blue-100   text-blue-700   dark:bg-blue-950  dark:text-blue-300',
  feature:        'bg-primary-container text-on-primary-container dark:bg-primary-container dark:text-on-primary-container',
  bug:            'bg-amber-100  text-amber-700  dark:bg-amber-950 dark:text-amber-300',
  refactor:       'bg-primary-fixed-dim text-on-primary-container dark:bg-primary-container dark:text-on-primary-container',
  infrastructure: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  design:         'bg-purple-100  text-purple-700  dark:bg-purple-950 dark:text-purple-300',
}

interface LabelChipProps {
  label: CardLabel
}

export function LabelChip({ label }: LabelChipProps) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STYLES[label.variant]}`}
    >
      {label.text}
    </span>
  )
}
