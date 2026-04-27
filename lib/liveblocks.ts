// ---------------------------------------------------------------------------
// Liveblocks client configuration and typed room context for FlowBoard.
//
// USAGE:
//   Import RoomProvider and hooks from this file — never directly from
//   @liveblocks/react — so all consumers share the same type parameters.
//
// ENV:
//   Set NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY in .env.local.
//   Get a free key at https://liveblocks.io/dashboard
// ---------------------------------------------------------------------------

import { createClient, LiveList, LiveMap } from '@liveblocks/client'
import type { JsonObject, LiveObject } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? '',
})

// ---------------------------------------------------------------------------
// Presence — per-user ephemeral state broadcast to all room members.
// cursor: null until the user moves the pointer (populated in Phase 2).
// name/hue: generated randomly on room join; replaced by auth in Phase 3.
// ---------------------------------------------------------------------------
export type Presence = {
  cursor: { x: number; y: number } | null
  name: string
  hue: number  // HSL hue 0–359, used by InitialAvatar for deterministic color
}

// ---------------------------------------------------------------------------
// Storage — the shared, conflict-safe CRDT document for the room.
// LiveMap gives field-level merging; LiveObject wraps each entity.
//
// NOTE: JsonObject (not Card/Column) is used here because LsonObject requires
// a string index signature that our domain interfaces intentionally omit.
// Phase 2 will introduce Liveblocks-compatible type aliases (null instead of
// undefined for optional fields) and tighten these to LiveObject<LiveCard> etc.
// ---------------------------------------------------------------------------
export type Storage = {
  cards: LiveMap<string, LiveObject<JsonObject>>
  columns: LiveMap<string, LiveObject<JsonObject>>
  columnOrder: LiveList<string>
}

// ---------------------------------------------------------------------------
// UserMeta — static info about each connected user (populated by auth endpoint
// in Phase 3). Stubs for now.
// ---------------------------------------------------------------------------
export type UserMeta = {
  id?: string
  info?: Record<string, never>
}

// ---------------------------------------------------------------------------
// RoomEvent — custom broadcast events (not yet used). Stub for now.
// ---------------------------------------------------------------------------
export type RoomEvent = Record<string, never>

// ---------------------------------------------------------------------------
// initialStorage factory — use this in RoomProvider to avoid importing
// Liveblocks data structures in page/component files.
// ---------------------------------------------------------------------------
export function createInitialStorage() {
  return {
    cards: new LiveMap<string, LiveObject<JsonObject>>(),
    columns: new LiveMap<string, LiveObject<JsonObject>>(),
    columnOrder: new LiveList<string>([]),
  }
}

// ---------------------------------------------------------------------------
// Typed room context — all hooks are re-exported from here.
// ---------------------------------------------------------------------------
export const {
  RoomProvider,
  useRoom,
  useSelf,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client)
