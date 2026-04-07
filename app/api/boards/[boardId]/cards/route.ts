import { NextResponse } from 'next/server'
import { addCard } from '@/lib/serverStore'
import type { Card } from '@/types/board'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const body = await req.json() as { card: Card }
  if (!body.card?.id) return NextResponse.json({ error: 'Invalid card' }, { status: 400 })

  const card = addCard(boardId, body.card)
  return NextResponse.json({ card }, { status: 201 })
}
