import { useEffect, useRef } from "react";
import { useStorage, useStatus } from "@/lib/liveblocks";
import { useBoardStore } from "@/store";
import { consumeLocalWrite } from "@/store/liveblocksChannel";
import { api } from "@/lib/api";
import type { Card, Column } from "@/types/board";
import type { JsonObject } from "@liveblocks/client";

/**
 * Syncs Liveblocks storage into the Zustand boardSlice.
 *
 * Two phases:
 *   1. Initial hydration — fires once when storage first becomes non-empty.
 *      Falls through to REST hydration if storage is empty.
 *   2. Delta sync — after hydration, detects per-entity changes in storage
 *      and calls applyServerDelta for changes that did not originate locally.
 *      Local writes are skipped via consumeLocalWrite() (set by liveblocksChannel
 *      before every broadcast so the echo is recognised and discarded).
 *
 * Constraints:
 *   - Must be called inside <RoomProvider>
 *   - boardSlice never receives Liveblocks objects — conversion happens here
 *   - Does not handle presence (separate Phase 2 concern)
 */
export function useBoardSync() {
  const applyServerDelta = useBoardStore((s) => s.applyServerDelta);
  const hydrate          = useBoardStore((s) => s.hydrate);
  const board = useBoardStore((s) => s.board);

  const hasSynced   = useRef(false);
  const prevStatus  = useRef<ReturnType<typeof useStatus> | null>(null);
  const status      = useStatus();

  // -------------------------------------------------------------------------
  // Reconnect handling — fires when Liveblocks recovers from 'reconnecting'.
  // Fetches a fresh server snapshot and rebases any pending optimistic mutations
  // on top of it so in-flight changes are not silently discarded.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (prevStatus.current === 'reconnecting' && status === 'connected') {
      api.getSnapshot()
        .then(snapshot => hydrate(snapshot, true))
        .catch(err => console.error('[FlowBoard] Reconnect re-sync failed', err))
    }
    prevStatus.current = status
  }, [status, hydrate])
  // Previous ReadonlyMap references — Liveblocks uses structural sharing so
  // an unchanged entry keeps the same object reference across storage updates.
  const prevCards = useRef<ReadonlyMap<string, Readonly<JsonObject>> | null>(null);
  const prevColumns = useRef<ReadonlyMap<string, Readonly<JsonObject>> | null>(null);

  // Return the raw ReadonlyMap references so we can compare entries by identity.
  // useStorage re-runs the selector only when storage actually changes.
  const storage = useStorage((root) => ({
    cards: root.cards as ReadonlyMap<string, Readonly<JsonObject>>,
    columns: root.columns as ReadonlyMap<string, Readonly<JsonObject>>,
  }));

  useEffect(() => {
    if (!storage) return;
    const { cards, columns } = storage;

    // -------------------------------------------------------------------------
    // Phase A — establish delta baseline
    // -------------------------------------------------------------------------
    if (!hasSynced.current) {
      // Wait until REST hydration has completed. The board entity is the signal:
      // it is null until hydrate(snapshot) is called from the page's useEffect.
      if (!board) return;

      // REST is the source of truth for initial data. Liveblocks storage only
      // holds individually mutated entities — not the full snapshot — so we must
      // never call hydrate() from storage here (it would overwrite with partial data).
      //
      // We only capture the current storage Maps as a reference baseline so
      // Phase B can detect future per-entry changes via reference comparison.
      hasSynced.current = true;
      prevCards.current = cards;
      prevColumns.current = columns;
      return;
    }

    // -------------------------------------------------------------------------
    // Phase B — delta sync (runs after hasSynced is true)
    // Liveblocks structural sharing: only entries that changed get new refs.
    // -------------------------------------------------------------------------
    const prev = prevCards.current;
    if (prev !== null && prev !== cards) {
      // Detect added / updated cards
      for (const [id, data] of cards) {
        if (prev.get(id) !== data) {
          if (consumeLocalWrite(id)) continue; // echo of our own write — skip
          const card = data as unknown as Card;
          applyServerDelta({ type: "SET_CARD", card, seqNo: card.seqNo ?? 0 });
        }
      }
      // Detect deleted cards
      for (const [id, prevData] of prev) {
        if (!cards.has(id)) {
          if (consumeLocalWrite(id)) continue;
          const prevCard = prevData as unknown as Card;
          applyServerDelta({
            type: "DELETE_CARD",
            cardId: id,
            columnId: prevCard.columnId,
            seqNo: Date.now(),
          });
        }
      }
    }

    const prevCols = prevColumns.current;
    if (prevCols !== null && prevCols !== columns) {
      // Detect added / updated columns
      for (const [id, data] of columns) {
        if (prevCols.get(id) !== data) {
          if (consumeLocalWrite(id)) continue;
          const column = data as unknown as Column;
          applyServerDelta({
            type: "SET_COLUMN",
            column,
            seqNo: column.seqNo ?? 0,
          });
        }
      }
      // Detect deleted columns
      for (const [id] of prevCols) {
        if (!columns.has(id)) {
          if (consumeLocalWrite(id)) continue;
          applyServerDelta({
            type: "DELETE_COLUMN",
            columnId: id,
            seqNo: Date.now(),
          });
        }
      }
    }

    prevCards.current = cards;
    prevColumns.current = columns;
  }, [storage, board, applyServerDelta]);
}
