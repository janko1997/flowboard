'use client'

import { useOthers } from '@/lib/liveblocks'
import { denormalizeCoords } from '@/lib/cursorCoords'

// Mounted at the BoardRoom level (sibling of AppShell, not a child of any board
// data component). position: fixed keeps it visually full-screen regardless of
// DOM position.
export function CursorOverlay() {
  const others = useOthers()

  if (typeof window === 'undefined') return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  return (
    <div
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        9999,
        overflow:      'hidden',
      }}
    >
      {others.map(o => {
        const { cursor, name, hue } = o.presence
        if (!cursor) return null

        const { x, y } = denormalizeCoords(cursor.x, cursor.y, vw, vh)
        const bg    = `hsl(${hue}, 55%, 72%)`
        const color = `hsl(${hue}, 45%, 25%)`

        return (
          <div
            key={o.connectionId}
            style={{
              position:   'absolute',
              left:       0,
              top:        0,
              transform:  `translate(${x}px, ${y}px)`,
              willChange: 'transform',
              display:    'flex',
              alignItems: 'flex-start',
            }}
          >
            <CursorSvg color={bg} />
            <div
              style={{
                marginLeft:   8,
                marginTop:    2,
                padding:      '2px 6px',
                borderRadius: 4,
                background:   bg,
                color,
                fontSize:     11,
                fontWeight:   600,
                whiteSpace:   'nowrap',
                lineHeight:   '16px',
                userSelect:   'none',
              }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CursorSvg({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="22"
      viewBox="0 0 16 22"
      fill={color}
      stroke="white"
      strokeWidth="1.2"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M0 0 L0 18 L4.5 13.5 L7.5 21 L10 20 L7 12.5 L12.5 12.5 Z" />
    </svg>
  )
}
