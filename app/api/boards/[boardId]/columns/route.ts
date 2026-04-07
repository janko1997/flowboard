import { NextResponse } from 'next/server'
import { addColumn } from '@/lib/serverStore'
import type { Column } from '@/types/board'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params
  const body = await req.json() as { column: Column }
  if (!body.column?.id) return NextResponse.json({ error: 'Invalid column' }, { status: 400 })

  const column = addColumn(boardId, body.column)
  return NextResponse.json({ column }, { status: 201 })
}
