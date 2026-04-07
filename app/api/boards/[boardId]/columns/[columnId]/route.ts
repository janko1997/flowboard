import { NextResponse } from 'next/server'
import { updateColumn, deleteColumn } from '@/lib/serverStore'
import type { Column } from '@/types/board'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ boardId: string; columnId: string }> },
) {
  const { boardId, columnId } = await params
  const patch = await req.json() as Partial<Pick<Column, 'title' | 'position'>>

  const column = updateColumn(boardId, columnId, patch)
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  return NextResponse.json({ column })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ boardId: string; columnId: string }> },
) {
  const { boardId, columnId } = await params
  const ok = deleteColumn(boardId, columnId)
  if (!ok) return NextResponse.json({ error: 'Column not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
