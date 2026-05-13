'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Dimension = 'speed' | 'recall' | 'duplicate'
type TaskStatus = 'pending' | 'running' | 'done' | 'failed'

type SiteConfig = {
  id: string
  name: string
  dimension: Dimension
  searchUrlTemplate: string
  enabled: boolean
}

type EvalTask = {
  id: string
  dimension: Dimension
  status: TaskStatus
  createdAt: string
}

const initialSites: SiteConfig[] = [
  { id: 'qianlima', name: '千里马招标网', dimension: 'recall', searchUrlTemplate: 'https://search.qianlima.com/?q={kw}#/search', enabled: true },
  { id: 'yfbzb', name: '优发标招标网', dimension: 'duplicate', searchUrlTemplate: 'https://www.yfbzb.com/search/invitedBidSearch?defaultSearch=true&keyword={kw}', enabled: true },
]

const initialTasks: EvalTask[] = [
  { id: 'task-1001', dimension: 'speed', status: 'done', createdAt: new Date().toLocaleString('zh-CN') },
  { id: 'task-1002', dimension: 'recall', status: 'running', createdAt: new Date().toLocaleString('zh-CN') },
]

export default function AdminPage() {
  const [sites, setSites] = useState<SiteConfig[]>(initialSites)
  const [tasks, setTasks] = useState<EvalTask[]>(initialTasks)
  const [name, setName] = useState('')
  const [dimension, setDimension] = useState<Dimension>('recall')
  const [url, setUrl] = useState('')

  const enabledCount = useMemo(() => sites.filter(s => s.enabled).length, [sites])

  const addSite = () => {
    if (!name.trim() || !url.trim()) return
    const id = `${dimension}-${Date.now()}`
    setSites(prev => [...prev, { id, name: name.trim(), dimension, searchUrlTemplate: url.trim(), enabled: true }])
    setName('')
    setUrl('')
  }

  const toggleSite = (id: string) => {
    setSites(prev => prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  const createTask = (d: Dimension) => {
    const id = `task-${Date.now()}`
    setTasks(prev => [{ id, dimension: d, status: 'pending', createdAt: new Date().toLocaleString('zh-CN') }, ...prev])
  }

  const exportCsv = () => {
    const header = 'id,name,dimension,enabled,searchUrlTemplate\n'
    const body = sites
      .map(s => `${s.id},${s.name},${s.dimension},${s.enabled ? 1 : 0},"${s.searchUrlTemplate.replace(/"/g, '""')}"`)
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `site-config-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">评测后台控制台</h1>
        <p className="text-muted-foreground mt-2">配置各维度采集地址、触发评测任务、导出过程数据用于验收。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>站点配置数</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{sites.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>启用站点</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{enabledCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>任务总数</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{tasks.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>维度采集地址配置</CardTitle>
          <CardDescription>可按维度维护搜索地址模板，支持关键词占位符 {'{kw}'}。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2"><Label>站点名称</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：某招标网" /></div>
            <div className="space-y-2"><Label>评测维度</Label>
              <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="speed">更新速度</SelectItem>
                  <SelectItem value="recall">召回率</SelectItem>
                  <SelectItem value="duplicate">重复率</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2"><Label>地址模板</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xx.com/search?q={kw}" /></div>
          </div>
          <div className="flex gap-2"><Button onClick={addSite}>新增地址</Button><Button variant="outline" onClick={exportCsv}>导出配置CSV</Button></div>
          <div className="rounded-md border divide-y">
            {sites.map(site => (
              <div key={site.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{site.name} <Badge variant="secondary">{site.dimension}</Badge></p>
                  <p className="text-xs text-muted-foreground break-all">{site.searchUrlTemplate}</p>
                </div>
                <Button size="sm" variant={site.enabled ? 'default' : 'outline'} onClick={() => toggleSite(site.id)}>{site.enabled ? '已启用' : '已禁用'}</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>任务控制与验收数据</CardTitle>
          <CardDescription>手动触发维度任务并查看状态（原型页面，后续可接真实队列与数据库）。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => createTask('speed')}>触发更新速度任务</Button>
            <Button onClick={() => createTask('recall')}>触发召回率任务</Button>
            <Button onClick={() => createTask('duplicate')}>触发重复率任务</Button>
          </div>
          <div className="rounded-md border divide-y">
            {tasks.map(task => (
              <div key={task.id} className="p-3 flex items-center justify-between">
                <div><p className="font-medium">{task.id}</p><p className="text-xs text-muted-foreground">{task.createdAt}</p></div>
                <div className="flex items-center gap-2"><Badge variant="secondary">{task.dimension}</Badge><Badge>{task.status}</Badge></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
