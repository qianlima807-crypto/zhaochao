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
type SiteRole = 'source' | 'target'

type SiteConfig = {
  id: string
  name: string
  dimension: Dimension
  role: SiteRole
  baseUrl: string
  searchPath: string
  keywordParam: string
  fixedParams: string
  enabled: boolean
}

type EvalTask = {
  id: string
  dimension: Dimension
  status: TaskStatus
  createdAt: string
}

const initialSites: SiteConfig[] = [
  { id: 'ccgp', name: '中国政府采购网', dimension: 'speed', role: 'source', baseUrl: 'https://search.ccgp.gov.cn', searchPath: '/bxsearch', keywordParam: 'searchparam', fixedParams: 'searchtype=2&dbselect=bidx', enabled: true },
  { id: 'qianlima', name: '千里马招标网', dimension: 'recall', role: 'target', baseUrl: 'https://search.qianlima.com', searchPath: '/', keywordParam: 'q', fixedParams: '#/search', enabled: true },
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
  const [role, setRole] = useState<SiteRole>('target')
  const [baseUrl, setBaseUrl] = useState('')
  const [searchPath, setSearchPath] = useState('')
  const [keywordParam, setKeywordParam] = useState('q')
  const [fixedParams, setFixedParams] = useState('')

  const enabledCount = useMemo(() => sites.filter(s => s.enabled).length, [sites])

  const addSite = () => {
    if (!name.trim() || !baseUrl.trim() || !searchPath.trim() || !keywordParam.trim()) return
    const id = `${dimension}-${Date.now()}`
    setSites(prev => [...prev, { id, name: name.trim(), dimension, role, baseUrl: baseUrl.trim(), searchPath: searchPath.trim(), keywordParam: keywordParam.trim(), fixedParams: fixedParams.trim(), enabled: true }])
    setName('')
    setBaseUrl('')
    setSearchPath('')
    setKeywordParam('q')
    setFixedParams('')
  }

  const toggleSite = (id: string) => {
    setSites(prev => prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  const createTask = (d: Dimension) => {
    const id = `task-${Date.now()}`
    setTasks(prev => [{ id, dimension: d, status: 'pending', createdAt: new Date().toLocaleString('zh-CN') }, ...prev])
  }

  const exportCsv = () => {
    const header = 'id,name,dimension,role,enabled,baseUrl,searchPath,keywordParam,fixedParams\n'
    const body = sites
      .map(s => `${s.id},${s.name},${s.dimension},${s.role},${s.enabled ? 1 : 0},"${s.baseUrl}","${s.searchPath}",${s.keywordParam},"${s.fixedParams.replace(/"/g, '""')}"`)
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
          <CardDescription>按维度和角色（源头/第三方）维护站点配置；查询参数由系统运行时注入标题，不再手填完整查询URL。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-6">
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
            <div className="space-y-2"><Label>站点角色</Label>
              <Select value={role} onValueChange={(v) => setRole(v as SiteRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">发布源头</SelectItem>
                  <SelectItem value="target">第三方</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Base URL</Label><Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://xx.com" /></div>
            <div className="space-y-2"><Label>Search Path</Label><Input value={searchPath} onChange={e => setSearchPath(e.target.value)} placeholder="/search" /></div>
            <div className="space-y-2"><Label>关键词参数名</Label><Input value={keywordParam} onChange={e => setKeywordParam(e.target.value)} placeholder="q / keyword" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-1">
            <div className="space-y-2"><Label>固定参数（可选）</Label><Input value={fixedParams} onChange={e => setFixedParams(e.target.value)} placeholder="例如：searchtype=2&dbselect=bidx" /></div>
          </div>
          <div className="flex gap-2"><Button onClick={addSite}>新增地址</Button><Button variant="outline" onClick={exportCsv}>导出配置CSV</Button></div>
          <div className="rounded-md border divide-y">
            {sites.map(site => (
              <div key={site.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{site.name} <Badge variant="secondary">{site.dimension}</Badge> <Badge variant="outline">{site.role}</Badge></p>
                  <p className="text-xs text-muted-foreground break-all">{site.baseUrl}{site.searchPath} | keyword={site.keywordParam} | fixed={site.fixedParams || '-'}</p>
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
