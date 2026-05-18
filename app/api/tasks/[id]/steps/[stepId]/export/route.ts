import fs from 'fs'
import { NextResponse } from 'next/server'
import { getTask } from '@/lib/eval-runner'

export async function GET(_: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { id, stepId } = await params
  const task = getTask(id)
  if (!task) return NextResponse.json({ error: 'task not found' }, { status: 404 })
  const step = task.steps.find(s => s.id === stepId)
  if (!step?.artifact || !fs.existsSync(step.artifact)) return NextResponse.json({ error: 'artifact not ready' }, { status: 404 })
  const data = fs.readFileSync(step.artifact)
  return new Response(data, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${id}-${stepId}.csv"` } })
}
