'use client'

import { useOthers, useSelf } from '@/lib/liveblocks'
import { InitialAvatar } from '@/components/board/ProjectHeader'

const MAX_VISIBLE = 5

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type AvatarEntry = { id: string; initials: string; hue: number; title: string }

export function PresenceBar() {
  const self   = useSelf()
  const others = useOthers()

  const selfEntry: AvatarEntry | null = self
    ? {
        id:       'self',
        initials: getInitials(self.presence.name),
        hue:      self.presence.hue,
        title:    'You',
      }
    : null

  const othersEntries: AvatarEntry[] = others.map(o => ({
    id:       String(o.connectionId),
    initials: getInitials(o.presence.name),
    hue:      o.presence.hue,
    title:    o.presence.name,
  }))

  const all      = selfEntry ? [selfEntry, ...othersEntries] : othersEntries
  const visible  = all.slice(0, MAX_VISIBLE)
  const overflow = all.length - MAX_VISIBLE

  return (
    <div className="flex items-center -space-x-2" data-testid="presence-bar">
      {visible.map(u => (
        <InitialAvatar key={u.id} initials={u.initials} hue={u.hue} size={8} ring title={u.title} />
      ))}
      {overflow > 0 && (
        <div
          className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-container-highest text-[10px] font-bold text-on-surface-variant"
          data-testid="presence-overflow"
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
