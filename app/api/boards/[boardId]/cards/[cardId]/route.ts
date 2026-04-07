import { NextResponse } from 'next/server'
import { updateCard, deleteCard } from '@/lib/serverStore'
import type { Card } from '@/types/board'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string; cardId: string }> },
) {
  const { boardId, cardId } = await params
  const patch = await req.json() as Partial<Pick<Card, 'title' | 'columnId' | 'position'>>

  const card = updateCard(boardId, cardId, patch)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  return NextResponse.json({ card })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ boardId: string; cardId: string }> },
) {
  const { boardId, cardId } = await params
  const ok = deleteCard(boardId, cardId)
  if (!ok) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
