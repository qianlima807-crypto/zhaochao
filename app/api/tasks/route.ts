import { NextResponse } from 'next/server'
import { createTask, listTasks } from '@/lib/eval-runner'

export async function GET() { return NextResponse.json({ tasks: listTasks() }) }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const dimension = body?.dimension as 'speed'|'recall'|'duplicate'
  if (!dimension) return NextResponse.json({ error: 'dimension required' }, { status: 400 })
  const task = createTask(dimension)
  return NextResponse.json(task)
}
