'use client'

import { useMemo, useState, Suspense, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { websites, termDefinitions, periodOptions, infoTypes } from '@/lib/mock-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  FileText,
  Download,
  Clock,
  Target,
  Copy,
  HelpCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Trophy,
  AlertCircle,
  Loader2,
} from 'lucide-react'

function TermTooltip({ term, children }: { term: string; children: React.ReactNode }) {
  const definition = termDefinitions[term]
  if (!definition) return <>{children}</>

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dashed border-muted-foreground">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">{term}</p>
        <p className="text-xs text-muted-foreground">{definition}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function ReportContent() {
  const searchParams = useSearchParams()
  const params = useParams<{ id: string }>()
  const [expandedSamples, setExpandedSamples] = useState<string[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 解析URL参数
  const websiteIds = searchParams.get('websites')?.split(',') || []
  const period = searchParams.get('period') || '7d'
  const infoType = searchParams.get('infoType') || 'bidding'
  const dimensionIds = searchParams.get('dimensions')?.split(',') || ['speed', 'recall', 'duplicate']

  useEffect(() => {
    let canceled = false
    const load = async () => {
      setLoading(true)
      try {
        const resp = await fetch(`/api/reports/${params?.id}?websites=${websiteIds.join(',')}&period=${period}&infoType=${infoType}&dimensions=${dimensionIds.join(',')}`)
        if (!resp.ok) throw new Error('no real report')
        const data = await resp.json()
        if (!canceled) setReport(data)
      } catch {
        if (!canceled) setReport(null)
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    load()
    return () => {
      canceled = true
    }
  }, [params?.id, websiteIds, period, infoType, dimensionIds])

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-muted-foreground">正在加载真实评测数据...</div>
  }

  if (!report) {
    return <div className="container mx-auto px-4 py-8"><Card><CardHeader><CardTitle>暂无真实评测数据</CardTitle><CardDescription>请先在后台控制端触发真实评测任务，任务完成后再查看报告。</CardDescription></CardHeader></Card></div>
  }

  const periodLabel = periodOptions.find(p => p.value === period)?.label || period
  const infoTypeLabel = infoTypes.find(t => t.value === infoType)?.label || infoType

  const toggleSample = (sampleId: string) => {
    setExpandedSamples(prev =>
      prev.includes(sampleId)
        ? prev.filter(id => id !== sampleId)
        : [...prev, sampleId]
    )
  }

  // 图表配置
  const chartConfig = report.websites.reduce((acc, website, index) => {
    acc[website.id] = {
      label: website.name,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  // 雷达图数据
  const radarData = [
    {
      dimension: '更新速度',
      ...report.speedData.reduce((acc, item) => {
        const website = report.websites.find(w => w.name === item.website)
        if (website) {
          acc[website.id] = Math.max(0, 100 - item.avg)
        }
        return acc
      }, {} as Record<string, number>),
    },
    {
      dimension: '召回率',
      ...report.recallData.reduce((acc, item) => {
        const website = report.websites.find(w => w.name === item.website)
        if (website) {
          acc[website.id] = item.rate
        }
        return acc
      }, {} as Record<string, number>),
    },
    {
      dimension: '去重能力',
      ...report.duplicateData.reduce((acc, item) => {
        const website = report.websites.find(w => w.name === item.website)
        if (website) {
          acc[website.id] = Math.max(0, 100 - item.rate * 10)
        }
        return acc
      }, {} as Record<string, number>),
    },
  ]

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        {/* 报告标题 */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">招投标网站对比评测报告</h1>
            <p className="mt-2 text-muted-foreground">
              生成时间: {new Date(report.createdAt).toLocaleString('zh-CN')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{periodLabel}</Badge>
              <Badge variant="secondary">{infoTypeLabel}</Badge>
              <Badge variant="outline">{report.websites.length} 个网站</Badge>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出PDF
          </Button>
        </div>

        {/* 摘要卡片 */}
        <Card className="mb-8 gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              评测摘要
            </CardTitle>
            <CardDescription>各维度表现最佳的网站</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  更新速度最快
                </div>
                <p className="text-lg font-semibold text-foreground">{report.summary.bestSpeed}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  召回率最高
                </div>
                <p className="text-lg font-semibold text-foreground">{report.summary.bestRecall}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Copy className="h-4 w-4" />
                  重复度最低
                </div>
                <p className="text-lg font-semibold text-foreground">{report.summary.bestDuplicate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 综合对比雷达图 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>综合能力对比</CardTitle>
            <CardDescription>各网站在不同维度的表现对比</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  {report.websites.map((website, index) => (
                    <Radar
                      key={website.id}
                      name={website.name}
                      dataKey={website.id}
                      stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                      fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 更新速度详情 */}
        {dimensionIds.includes('speed') && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                更新速度测试
              </CardTitle>
              <CardDescription>
                从官方网站发布到平台收录的时间间隔，数值越小表示更新越及时
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={report.speedData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        type="category"
                        dataKey="website"
                        width={100}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="p50" name="P50延迟(分钟)" fill="hsl(var(--chart-1))" />
                      <Bar dataKey="avg" name="平均延迟(分钟)" fill="hsl(var(--chart-2))" />
                      <Bar dataKey="p95" name="P95延迟(分钟)" fill="hsl(var(--chart-3))" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* 数据表格 */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium">网站</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <TermTooltip term="P50延迟">P50延迟</TermTooltip>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">平均延迟</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <TermTooltip term="P95延迟">P95延迟</TermTooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.speedData.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{item.website}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.p50}分钟</td>
                        <td className="px-4 py-3 text-right font-mono">{item.avg}分钟</td>
                        <td className="px-4 py-3 text-right font-mono">{item.p95}分钟</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 召回率详情 */}
        {dimensionIds.includes('recall') && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                召回率测试
              </CardTitle>
              <CardDescription>
                在官方发布的招标信息中，各平台能够收录的比例
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 数据表格 */}
              <div className="mb-6 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium">网站</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <TermTooltip term="样本采样">样本总数</TermTooltip>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">命中数量</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <TermTooltip term="召回率">召回率</TermTooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recallData.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{item.website}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.totalSamples}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.found}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={item.rate >= 95 ? 'default' : item.rate >= 90 ? 'secondary' : 'outline'}
                          >
                            {item.rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 可验证样本 */}
              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 px-4 py-3">
                  <h4 className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    可验证样本数据
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>展示具体的测试样本，您可以自行验证各平台的收录情况</p>
                      </TooltipContent>
                    </Tooltip>
                  </h4>
                </div>
                <div className="divide-y divide-border/50">
                  {report.verifiableSamples.slice(0, 10).map((sample) => (
                    <Collapsible
                      key={sample.id}
                      open={expandedSamples.includes(sample.id)}
                      onOpenChange={() => toggleSample(sample.id)}
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/20">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{sample.title}</p>
                          <p className="text-xs text-muted-foreground">
                            发布时间: {sample.publishTime} | 来源: {sample.source}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {sample.results.map((result) => (
                              result.found ? (
                                <CheckCircle
                                  key={result.websiteId}
                                  className="h-4 w-4 text-[oklch(0.7_0.2_145)]"
                                />
                              ) : (
                                <XCircle
                                  key={result.websiteId}
                                  className="h-4 w-4 text-destructive"
                                />
                              )
                            ))}
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSamples.includes(sample.id) ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {sample.results.map((result) => (
                              <div
                                key={result.websiteId}
                                className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                                  result.found
                                    ? 'border-[oklch(0.7_0.2_145)]/30 bg-[oklch(0.7_0.2_145)]/10'
                                    : 'border-destructive/30 bg-destructive/10'
                                }`}
                              >
                                {result.found ? (
                                  <CheckCircle className="h-4 w-4 shrink-0 text-[oklch(0.7_0.2_145)]" />
                                ) : (
                                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{result.websiteName}</p>
                                  {result.found && result.delay && (
                                    <p className="text-xs text-muted-foreground">
                                      延迟: {result.delay}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 重复度详情 */}
        {dimensionIds.includes('duplicate') && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-primary" />
                重复度测试
              </CardTitle>
              <CardDescription>
                平台中同一条信息出现多次的比例，数值越低表示去重效果越好
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium">网站</th>
                      <th className="px-4 py-3 text-right font-medium">检测条目</th>
                      <th className="px-4 py-3 text-right font-medium">重复条目</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <TermTooltip term="重复度">重复率</TermTooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.duplicateData.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{item.website}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.totalItems}</td>
                        <td className="px-4 py-3 text-right font-mono">{item.duplicates}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge
                            variant={item.rate <= 2 ? 'default' : item.rate <= 5 ? 'secondary' : 'outline'}
                          >
                            {item.rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 结论与建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              结论与建议
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              基于本次对{report.websites.length}个招投标网站的评测结果，我们得出以下结论：
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li>
                <strong>更新速度方面</strong>：{report.summary.bestSpeed}表现最佳，
                能够在较短时间内收录最新的招标信息。
              </li>
              <li>
                <strong>信息覆盖方面</strong>：{report.summary.bestRecall}的召回率最高，
                能够覆盖更多的招标信息。
              </li>
              <li>
                <strong>去重能力方面</strong>：{report.summary.bestDuplicate}的重复率最低，
                用户体验更好。
              </li>
            </ul>
            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                <strong>声明</strong>：本报告数据为演示数据，仅供参考。实际评测结果可能因测试时间、
                采样方法等因素而有所不同。如需进行正式评测，请联系专业评测机构。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
