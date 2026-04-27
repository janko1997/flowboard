// ---------------------------------------------------------------------------
// useLiveblocksWriter — registers Liveblocks storage write callbacks into the
// liveblocksChannel so mutationQueue can broadcast confirmed mutations.
//
// Must be called from a component inside <RoomProvider>.
// Clears the registration on unmount so stale closures can never fire.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { LiveObject } from '@liveblocks/client'
import type { JsonObject } from '@liveblocks/client'
import { useMutation } from '@/lib/liveblocks'
import { registerLiveblocksWriter } from '@/store/liveblocksChannel'
import type { Card, Column } from '@/types/board'

export function useLiveblocksWriter() {
  // Each useMutation call returns a stable callback (safe to call outside React)
  // that writes to Liveblocks storage and broadcasts the change to other clients.
  // seqNo = Date.now() gives a monotonic ordering proxy for Phase 2.
  // Phase 3 will replace this with a vector clock from lib/vectorClock.ts.

  const setCard = useMutation(({ storage }, card: Card) => {
    const cardWithSeqNo = { ...card, seqNo: Date.now() } as unknown as JsonObject
    storage.get('cards')!.set(card.id, new LiveObject(cardWithSeqNo))
  }, [])

  const deleteCard = useMutation(({ storage }, cardId: string) => {
    storage.get('cards')!.delete(cardId)
  }, [])

  const setColumn = useMutation(({ storage }, column: Column) => {
    const colWithSeqNo = { ...column, seqNo: Date.now() } as unknown as JsonObject
    storage.get('columns')!.set(column.id, new LiveObject(colWithSeqNo))
  }, [])

  const deleteColumn = useMutation(({ storage }, columnId: string) => {
    storage.get('columns')!.delete(columnId)
  }, [])

  useEffect(() => {
    registerLiveblocksWriter({ setCard, deleteCard, setColumn, deleteColumn })
    return () => registerLiveblocksWriter(null)
  }, [setCard, deleteCard, setColumn, deleteColumn])
}
