'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { websites, loadingSteps } from '@/lib/mock-data'
import { CheckCircle, Loader2, Circle, Terminal } from 'lucide-react'

// 预先生成所有步骤的日志，避免动态生成
function generateAllLogs(websiteNames: string[], activeStepIds: string[]) {
  const allLogs: { step: number; time: string; type: 'info' | 'success' | 'warning' | 'data'; message: string }[] = []
  
  const getTime = () => new Date().toLocaleTimeString('zh-CN', { hour12: false })
  
  const isStepEnabled = (stepId: string) => activeStepIds.includes(stepId)

  // Step 0: init
  if (isStepEnabled('init')) allLogs.push(
    { step: 0, time: getTime(), type: 'info', message: '初始化 BidCrawler v3.2.1...' },
    { step: 0, time: getTime(), type: 'info', message: '加载爬虫配置文件...' },
    { step: 0, time: getTime(), type: 'success', message: '爬虫引擎启动成功' },
    { step: 0, time: getTime(), type: 'info', message: `检测到 ${websiteNames.length} 个目标网站` },
  )
  
  // Step 1: load-source
  if (isStepEnabled('load-source')) websiteNames.forEach(name => {
    allLogs.push(
      { step: 1, time: getTime(), type: 'info', message: `连接 ${name}...` },
      { step: 1, time: getTime(), type: 'success', message: `${name} 连接成功` },
    )
  })
  
  // Step 2: sample
  if (isStepEnabled('sample')) allLogs.push(
    { step: 2, time: getTime(), type: 'info', message: '开始随机采样...' },
    { step: 2, time: getTime(), type: 'data', message: '采样范围: 近30天招标公告' },
    { step: 2, time: getTime(), type: 'data', message: '样本数量: 500条' },
    { step: 2, time: getTime(), type: 'info', message: '正在从国家公共资源交易平台获取基准数据...' },
    { step: 2, time: getTime(), type: 'success', message: '基准数据获取完成，共 500 条记录' },
  )
  
  // Step 3: analyze-speed
  if (isStepEnabled('analyze-speed')) allLogs.push(
    { step: 3, time: getTime(), type: 'info', message: '开始计算更新延迟...' },
    { step: 3, time: getTime(), type: 'data', message: '分析方法: 对比原始发布时间与平台收录时间' },
  )
  if (isStepEnabled('analyze-speed')) {
    websiteNames.forEach(name => {
      allLogs.push(
        { step: 3, time: getTime(), type: 'info', message: `分析 ${name} 更新速度...` },
        { step: 3, time: getTime(), type: 'data', message: `${name} P50延迟: ${Math.round(5 + Math.random() * 20)}分钟` },
      )
    })
    allLogs.push({ step: 3, time: getTime(), type: 'success', message: '更新速度分析完成' })
  }
  
  // Step 4: analyze-recall
  if (isStepEnabled('analyze-recall')) allLogs.push(
    { step: 4, time: getTime(), type: 'info', message: '开始计算召回率...' },
    { step: 4, time: getTime(), type: 'data', message: '对比样本与各平台收录情况' },
  )
  if (isStepEnabled('analyze-recall')) {
    websiteNames.forEach(name => {
      const rate = Math.round(85 + Math.random() * 15)
      allLogs.push(
        { step: 4, time: getTime(), type: 'info', message: `检索 ${name} 数据...` },
        { step: 4, time: getTime(), type: 'data', message: `${name} 召回率: ${rate}%` },
      )
    })
    allLogs.push({ step: 4, time: getTime(), type: 'success', message: '召回率计算完成' })
  }
  
  // Step 5: analyze-duplicate
  if (isStepEnabled('analyze-duplicate')) allLogs.push(
    { step: 5, time: getTime(), type: 'info', message: '开始检测重复信息...' },
    { step: 5, time: getTime(), type: 'data', message: '使用文本相似度算法进行去重分析' },
  )
  if (isStepEnabled('analyze-duplicate')) {
    websiteNames.forEach(name => {
      const rate = Math.round(1 + Math.random() * 5)
      allLogs.push(
        { step: 5, time: getTime(), type: 'info', message: `分析 ${name} 重复数据...` },
        { step: 5, time: getTime(), type: 'data', message: `${name} 重复率: ${rate}%` },
      )
    })
    allLogs.push({ step: 5, time: getTime(), type: 'success', message: '重复度分析完成' })
  }
  
  // Step 6: generate
  if (isStepEnabled('generate')) allLogs.push(
    { step: 6, time: getTime(), type: 'info', message: '汇总分析结果...' },
    { step: 6, time: getTime(), type: 'info', message: '生成可视化图表...' },
    { step: 6, time: getTime(), type: 'info', message: '编写评测报告...' },
    { step: 6, time: getTime(), type: 'success', message: '报告生成完成!' },
  )
  
  return allLogs
}

function LoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visibleLogCount, setVisibleLogCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [allLogs, setAllLogs] = useState<{ step: number; time: string; type: string; message: string }[]>([])

  // 解析URL参数
  const websiteIds = searchParams.get('websites')?.split(',') || []
  const period = searchParams.get('period') || '7d'
  const infoType = searchParams.get('infoType') || 'bidding'
  const dimensionIds = searchParams.get('dimensions')?.split(',') || ['speed', 'recall', 'duplicate']
  
  const selectedWebsites = websites.filter(w => websiteIds.includes(w.id))

  const activeStepIds = ['init', 'load-source', 'sample', ...dimensionIds.map(id => `analyze-${id}`), 'generate']

  // 计算总时长（演示用：保持节奏紧凑，避免用户等待过久）
  const rawDuration = loadingSteps
    .filter(step => activeStepIds.includes(step.id))
    .reduce((sum, step) => sum + step.duration, 0)
  const totalDuration = Math.min(15000, Math.max(9000, Math.round(rawDuration * 0.35)))

  // 初始化日志数据
  useEffect(() => {
    if (hasInitialized.current) return
    if (selectedWebsites.length < 2) {
      router.push('/compare')
      return
    }
    
    hasInitialized.current = true
    const websiteNames = selectedWebsites.map(w => w.name)
    const logs = generateAllLogs(websiteNames, activeStepIds)
    setAllLogs(logs)
  }, [selectedWebsites, router, activeStepIds])

  // 主动画循环
  useEffect(() => {
    if (allLogs.length === 0) return

    let stepIndex = 0
    let logIndex = 0
    let elapsedTime = 0
    
    // 更新进度条
    const progressInterval = setInterval(() => {
      elapsedTime += 100
      const newProgress = Math.min((elapsedTime / totalDuration) * 100, 100)
      setProgress(newProgress)
    }, 100)

    // 逐条显示日志（根据总时长自动调速）
    const logIntervalMs = Math.max(90, Math.min(220, Math.floor(totalDuration / Math.max(allLogs.length, 1))))
    const logInterval = setInterval(() => {
      if (logIndex < allLogs.length) {
        setVisibleLogCount(logIndex + 1)
        
        // 更新当前步骤
        const currentLog = allLogs[logIndex]
        if (currentLog && currentLog.step !== stepIndex) {
          stepIndex = currentLog.step
          setCurrentStepIndex(stepIndex)
        }
        
        logIndex++
      }
    }, logIntervalMs)

    // 计算完成时间（基于总时长）
    const completeTimeout = setTimeout(() => {
      setIsComplete(true)
      setProgress(100)
      setCurrentStepIndex(loadingSteps.length)
      setVisibleLogCount(allLogs.length)
      
      // 跳转到报告页
      setTimeout(() => {
        const params = new URLSearchParams({
          websites: websiteIds.join(','),
          period,
          infoType,
          dimensions: dimensionIds.join(','),
        })
        const reportId = `report-${Date.now()}`
        router.push(`/compare/report/${reportId}?${params.toString()}`)
      }, 1500)
    }, totalDuration)

    return () => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
      clearTimeout(completeTimeout)
    }
  }, [allLogs, totalDuration, router, websiteIds, period, infoType, dimensionIds])

  // 自动滚动到底部（使用 requestAnimationFrame 避免循环）
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [visibleLogCount, scrollToBottom])

  const remainingTime = Math.max(0, Math.ceil((totalDuration - (progress / 100) * totalDuration) / 1000))
  const visibleLogs = allLogs.slice(0, visibleLogCount)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">正在进行对比评测</h1>
        <p className="mt-2 text-muted-foreground">
          系统正在分析 {selectedWebsites.length} 个网站的数据，请稍候...
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* 左侧：终端窗口 */}
          <div className="lg:col-span-3">
            <div className="terminal-window">
              <div className="terminal-header">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="ml-4 font-mono text-xs text-muted-foreground">
                  BidCrawler Terminal
                </span>
              </div>
              
              <div 
                ref={scrollRef}
                className="h-[400px] overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted"
              >
                <div className="space-y-1 font-mono text-sm">
                  {visibleLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                    >
                      <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-[oklch(0.7_0.2_145)]'
                            : log.type === 'warning'
                              ? 'text-[oklch(0.8_0.18_85)]'
                              : log.type === 'data'
                                ? 'text-[oklch(0.7_0.15_240)]'
                                : 'text-foreground'
                        }
                      >
                        {log.type === 'success' && '✓ '}
                        {log.type === 'warning' && '! '}
                        {log.type === 'data' && '→ '}
                        {log.message}
                      </span>
                    </div>
                  ))}
                  
                  {/* 闪烁光标 */}
                  {!isComplete && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <span className="animate-terminal-blink inline-block h-4 w-2 bg-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：进度指示 */}
          <div className="lg:col-span-2">
            <Card className="gradient-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Terminal className="h-5 w-5 text-primary" />
                  评测进度
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 进度条 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总体进度</span>
                    <span className="font-mono text-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    预计剩余时间: {remainingTime} 秒
                  </p>
                </div>

                {/* 步骤列表 */}
                <div className="space-y-3">
                  {loadingSteps.map((step, index) => {
                    const isActive = index === currentStepIndex
                    const isDone = index < currentStepIndex || isComplete
                    
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10'
                            : isDone
                              ? 'border-border/50 bg-muted/30'
                              : 'border-border/30 opacity-50'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="h-5 w-5 shrink-0 text-[oklch(0.7_0.2_145)]" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={`text-sm ${
                            isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 对比网站列表 */}
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs text-muted-foreground">对比网站</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedWebsites.map((website) => (
                      <Badge key={website.id} variant="secondary" className="text-xs">
                        {website.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 完成提示 */}
                {isComplete && (
                  <div className="animate-fade-in-up rounded-lg border border-[oklch(0.7_0.2_145)] bg-[oklch(0.7_0.2_145)]/10 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-[oklch(0.7_0.2_145)]" />
                    <p className="font-medium text-foreground">评测完成!</p>
                    <p className="text-sm text-muted-foreground">正在跳转到报告页面...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompareLoadingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoadingContent />
    </Suspense>
  )
}
