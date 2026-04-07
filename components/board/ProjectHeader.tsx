'use client'

// ---------------------------------------------------------------------------
// ProjectHeader — breadcrumb, board title, presence avatars, view tabs.
//
// Phase 1:
// - Avatars are static placeholders from mock data (no Liveblocks yet).
// - Only the "Board" tab is active; List/Timeline are visual stubs.
// - The presence slot is structurally reserved so Phase 2 can swap in
//   real Liveblocks useOthers() data without touching this component.
// ---------------------------------------------------------------------------

import { useBoardStore } from '@/store'

// Static team members for the presence strip — Phase 2 replaces with useOthers()
const STATIC_MEMBERS = [
  { initials: 'AJ', hue: 30 },
  { initials: 'SL', hue: 210 },
  { initials: 'CW', hue: 340 },
  { initials: 'MR', hue: 160 },
]

export function ProjectHeader() {
  const boardTitle = useBoardStore(s => s.board?.title ?? 'Untitled Board')

  return (
    <div className="flex flex-shrink-0 flex-col gap-4 border-b border-outline-variant/10 bg-surface px-8 pt-6 pb-0">
      {/* Row 1: breadcrumb + title + presence + share */}
      <div className="flex items-start justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Projects</span>
            <ChevronIcon />
            <span className="text-on-surface">{boardTitle}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
            {boardTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Presence strip — Phase 2: swap with useOthers() avatars */}
          <div className="flex items-center -space-x-2">
            {STATIC_MEMBERS.map((m) => (
              <InitialAvatar key={m.initials} initials={m.initials} hue={m.hue} size={8} ring />
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-container-highest text-[10px] font-bold text-on-surface-variant">
              +2
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high">
            <ShareIcon />
            Share
          </button>
        </div>
      </div>

      {/* Row 2: view tabs */}
      <div className="flex items-center gap-6 border-b border-outline-variant/20">
        <ViewTab label="Board" icon={<BoardIcon />} active />
        <ViewTab label="List"     icon={<ListIcon />} />
        <ViewTab label="Timeline" icon={<TimelineIcon />} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ViewTab({ label, icon, active }: { label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={[
        'flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors',
        active
          ? 'border-b-2 border-primary text-primary'
          : 'text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

export function InitialAvatar({
  initials,
  hue,
  size = 6,
  ring = false,
}: {
  initials: string
  hue: number
  size?: number
  ring?: boolean
}) {
  // Generate a deterministic pastel background from the hue
  const bg    = `hsl(${hue}, 55%, 72%)`
  const color = `hsl(${hue}, 45%, 25%)`
  const ringClass = ring ? 'ring-2 ring-surface' : ''

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${ringClass}`}
      style={{
        width:           `${size * 4}px`,
        height:          `${size * 4}px`,
        backgroundColor: bg,
        color,
        fontSize:        `${Math.max(9, size * 1.6)}px`,
      }}
      title={initials}
    >
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline icons
// ---------------------------------------------------------------------------
const ChevronIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
const ShareIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
const BoardIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="18" x="3" y="3" rx="1"/><rect width="7" height="10" x="14" y="3" rx="1"/><rect width="7" height="5" x="14" y="16" rx="1"/></svg>
const ListIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const TimelineIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg>
