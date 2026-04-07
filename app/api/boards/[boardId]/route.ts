import { NextResponse } from 'next/server'
import { getBoard } from '@/lib/serverStore'
import type { BoardSnapshot } from '@/types/board'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const data = getBoard(boardId)
  if (!data) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

  const snapshot: BoardSnapshot = {
    board:   data.board,
    columns: Object.values(data.columns),
    cards:   Object.values(data.cards),
  }
  return NextResponse.json(snapshot)
}
