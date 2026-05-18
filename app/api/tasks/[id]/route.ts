import { NextResponse } from 'next/server'
import { getTask } from '@/lib/eval-runner'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const task = getTask(id)
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(task)
}
