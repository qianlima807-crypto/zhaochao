'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Dimension = 'speed' | 'recall' | 'duplicate'
type SiteRole = 'source' | 'target'
type StepStatus = 'pending' | 'running' | 'done' | 'failed'

type SiteConfig = {
  id: string
  name: string
  dimension: Dimension
  role: SiteRole
  fullUrl: string
  baseUrl: string
  searchPath: string
  keywordParam?: string
  fixedParams: string
  enabled: boolean
}

type TaskStep = {
  id: string
  name: string
  status: StepStatus
  log: string[]
}

type EvalTask = {
  id: string
  dimension: Dimension
  status: 'pending' | 'running' | 'done' | 'failed'
  createdAt: string
  steps: TaskStep[]
  runtimeLogs?: string[]
}

const initialSites: SiteConfig[] = [
  { id: 'ccgp', name: '中国政府采购网', dimension: 'speed', role: 'source', fullUrl: 'https://search.ccgp.gov.cn/bxsearch', baseUrl: 'https://search.ccgp.gov.cn', searchPath: '/bxsearch', fixedParams: '', enabled: true },
  { id: 'ggzy', name: '全国公共资源交易平台', dimension: 'speed', role: 'source', fullUrl: 'https://www.ggzy.gov.cn/deal/dealList.html?DEAL_CLASSIFY=00&DEAL_STAGE=0001', baseUrl: 'https://www.ggzy.gov.cn', searchPath: '/deal/dealList.html', fixedParams: 'DEAL_CLASSIFY=00&DEAL_STAGE=0001', enabled: true },
  { id: 'sdccgp', name: '山东政府采购网', dimension: 'speed', role: 'source', fullUrl: 'http://www.ccgp-shandong.gov.cn/xxgk?colCode=0301&area=370000&selectedCode=0301&selectedCode1=0303&selectedName=%E9%87%87%E8%B4%AD%E5%85%AC%E5%91%8A', baseUrl: 'http://www.ccgp-shandong.gov.cn', searchPath: '/xxgk', fixedParams: 'colCode=0301&area=370000&selectedCode=0301&selectedCode1=0303&selectedName=%E9%87%87%E8%B4%AD%E5%85%AC%E5%91%8A', enabled: true },
  { id: 'yfbzb', name: '乙方宝招标网', dimension: 'recall', role: 'target', fullUrl: 'https://www.yfbzb.com/search/invitedBidSearch?defaultSearch=true', baseUrl: 'https://www.yfbzb.com', searchPath: '/search/invitedBidSearch', keywordParam: 'keyword', fixedParams: 'defaultSearch=true', enabled: true },
  { id: 'zhaobiaowang', name: '招标网', dimension: 'recall', role: 'target', fullUrl: 'https://s.zhaobiao.cn/search/index', baseUrl: 'https://s.zhaobiao.cn', searchPath: '/search/index', keywordParam: 'q', fixedParams: '', enabled: true },
  { id: 'qianlima', name: '千里马招标网', dimension: 'recall', role: 'target', fullUrl: 'https://search.qianlima.com/?q=#/search', baseUrl: 'https://search.qianlima.com', searchPath: '/', keywordParam: 'q', fixedParams: '#/search', enabled: true },
  { id: 'bidcenter', name: '采招网', dimension: 'recall', role: 'target', fullUrl: 'https://search.bidcenter.com.cn/', baseUrl: 'https://search.bidcenter.com.cn', searchPath: '/', keywordParam: 'q', fixedParams: '', enabled: true },
  { id: 'okcis', name: '招标采购导航网', dimension: 'recall', role: 'target', fullUrl: 'https://www.okcis.cn/search/', baseUrl: 'https://www.okcis.cn', searchPath: '/search/', keywordParam: 'q', fixedParams: '', enabled: true },
  { id: 'bidizhaobiao', name: '比地招标网', dimension: 'recall', role: 'target', fullUrl: 'https://www.bidizhaobiao.com/advsearch/retrieval_list.do', baseUrl: 'https://www.bidizhaobiao.com', searchPath: '/advsearch/retrieval_list.do', keywordParam: 'keyword', fixedParams: '', enabled: true },
  { id: 'jianyu360', name: '剑鱼标讯', dimension: 'recall', role: 'target', fullUrl: 'https://www.jianyu360.cn/jylab/supsearch/index.html?keywords=&selectType=title&searchGroup=1', baseUrl: 'https://www.jianyu360.cn', searchPath: '/jylab/supsearch/index.html', keywordParam: 'keywords', fixedParams: 'selectType=title&searchGroup=1', enabled: true },
  { id: 'chinabidding', name: '中国采购与招标网', dimension: 'recall', role: 'target', fullUrl: 'https://www.chinabidding.cn/public/yjsc/html/treetop_search.html?keywords=&start=&end=&search_type=CONTEXT&areaid=&categoryid=&b_date=month&table_type=&page=1', baseUrl: 'https://www.chinabidding.cn', searchPath: '/public/yjsc/html/treetop_search.html', keywordParam: 'keywords', fixedParams: 'start=&end=&search_type=CONTEXT&areaid=&categoryid=&b_date=month&table_type=&page=1', enabled: true },
  { id: '6dbx', name: '六度标讯', dimension: 'recall', role: 'target', fullUrl: 'https://www.6dbx.com/search.html?source=baidu&searchWords=', baseUrl: 'https://www.6dbx.com', searchPath: '/search.html', keywordParam: 'searchWords', fixedParams: 'source=baidu', enabled: true },
  { id: 'bbda', name: '标标达', dimension: 'recall', role: 'target', fullUrl: 'https://bbda.com/pc/', baseUrl: 'https://bbda.com', searchPath: '/pc/', keywordParam: 'q', fixedParams: '', enabled: true },
  { id: 'zhiliaobx', name: '知了标讯', dimension: 'recall', role: 'target', fullUrl: 'https://www.zhiliaobiaoxun.com/search/', baseUrl: 'https://www.zhiliaobiaoxun.com', searchPath: '/search/', keywordParam: 'q', fixedParams: '', enabled: true },
]

export default function AdminPage() {
  const sites = initialSites
  const [tasks, setTasks] = useState<EvalTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const enabledCount = useMemo(() => sites.filter(s => s.enabled).length, [sites])

  const stepStatusLabel = (status: StepStatus) => {
    if (status === 'running') return '进行中'
    if (status === 'done') return '已完成'
    if (status === 'failed') return '失败'
    return '待开始'
  }


  const createTask = async (d: Dimension) => {
    await fetch('/api/tasks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dimension: d }) })
    await refreshTasks()
  }

  const refreshTasks = async () => {
    setLoadingTasks(true)
    try {
      const resp = await fetch('/api/tasks')
      const data = await resp.json()
      setTasks(data.tasks || [])
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    refreshTasks()
    const t = setInterval(refreshTasks, 3000)
    return () => clearInterval(t)
  }, [])

  const exportStepData = (task: EvalTask, step: TaskStep) => {
    window.open(`/api/tasks/${task.id}/steps/${step.id}/export`, '_blank')
  }

  const exportCsv = () => {
    const header = 'id,name,dimension,role,enabled,fullUrl,baseUrl,searchPath,keywordParam,fixedParams\n'
    const body = sites
      .map(s => `${s.id},${s.name},${s.dimension},${s.role},${s.enabled ? 1 : 0},"${s.fullUrl.replace(/"/g, '""')}","${s.baseUrl}","${s.searchPath}",${s.keywordParam || ''},"${s.fixedParams.replace(/"/g, '""')}"`)
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
        <p className="text-muted-foreground mt-2">当前地址为评测固定配置（不可修改），可查看并导出用于验收。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>站点配置数</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{sites.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>启用站点</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{enabledCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>任务总数</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{tasks.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>固定评测地址配置（只读）</CardTitle>
          <CardDescription>更新速度使用3个发布源头；覆盖率与重复率使用固定11个第三方网站。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2"><Button variant="outline" onClick={exportCsv}>导出配置CSV</Button></div>
          <div className="rounded-md border divide-y">
            {sites.map(site => (
              <div key={site.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{site.name} <Badge variant="secondary">{site.dimension}</Badge> <Badge variant="outline">{site.role}</Badge></p>
                  <p className="text-xs text-muted-foreground break-all">{site.fullUrl}</p>
                  <p className="text-xs text-muted-foreground break-all">解析结果: {site.baseUrl}{site.searchPath} | keyword={site.keywordParam || '-'} | fixed={site.fixedParams || '-'}</p>
                </div>
                <Badge variant={site.enabled ? 'default' : 'outline'}>{site.enabled ? '已启用' : '已禁用'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>任务控制与验收环节</CardTitle>
          <CardDescription>展示真实任务分步骤状态、日志，并支持分步骤结果导出用于验收。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={refreshTasks}>刷新任务</Button>
            <Button onClick={() => createTask('speed')}>触发更新速度任务</Button>
            <Button onClick={() => createTask('recall')}>触发召回率任务</Button>
            <Button onClick={() => createTask('duplicate')}>触发重复率任务</Button>
          </div>
          <div className="rounded-md border divide-y">
            {loadingTasks && <div className="p-4 text-sm text-muted-foreground">任务状态刷新中...</div>}
            {!loadingTasks && tasks.length === 0 && <div className="p-4 text-sm text-muted-foreground">暂无任务，点击上方按钮触发。</div>}
            {tasks.map(task => (
              <div key={task.id} className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.id}</p>
                    <p className="text-xs text-muted-foreground">{task.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{task.dimension}</Badge>
                    <Badge variant={task.status === 'done' ? 'default' : task.status === 'failed' ? 'destructive' : 'outline'}>{task.status === 'running' ? '执行中' : task.status === 'done' ? '已完成' : '失败'}</Badge>
                    {task.status === 'running' && <Badge variant="outline">自动执行中</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">当前步骤：{task.steps.find(s => s.status === 'running')?.name || (task.status === 'done' ? '全部完成' : '等待执行')}</p>
                <div className="space-y-2">
                  {task.steps.map(step => (
                    <div key={step.id} className="rounded border p-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{step.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={step.status === 'done' ? 'default' : step.status === 'running' ? 'secondary' : step.status === 'failed' ? 'destructive' : 'outline'}>{stepStatusLabel(step.status)}</Badge>
                          {(step.status === 'running' || (step.status === 'done' && step.artifact)) && (
                            <Button size="sm" variant="outline" onClick={() => exportStepData(task, step)}>导出该步骤数据</Button>
                          )}
                        </div>
                      </div>
                      {step.log.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                          {step.log.map((line, idx) => <li key={idx}>{line}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                <div className="rounded border p-2">
                  <p className="text-sm font-medium mb-2">实时执行日志</p>
                  <div className="max-h-40 overflow-auto rounded bg-muted/40 p-2 font-mono text-xs">
                    {(task.runtimeLogs && task.runtimeLogs.length > 0) ? task.runtimeLogs.map((l, i) => (
                      <div key={i}>{l}</div>
                    )) : <div className="text-muted-foreground">暂无日志</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
