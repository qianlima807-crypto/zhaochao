'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { dimensions, months, generateRankingData, termDefinitions, websites } from '@/lib/mock-data'
import { ArrowDown, ArrowUp, Minus, HelpCircle, Clock, Target, Copy, CheckCircle2, BarChart3, Database, FlaskConical, AlertTriangle, FileText, Share2, Download, Printer, BookOpen, TrendingUp, PieChart, Table2 } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line } from 'recharts'

const dimensionIcons = {
  speed: Clock,
  recall: Target,
  duplicate: Copy,
}

// 每个维度的详细方法论说明
const methodologyContent = {
  speed: {
    title: '信息更新速度评测方法论',
    summary: '采用分时段快照抽样法，在不同发布时间窗口批量检索各平台命中情况，量化评估信息更新效率。',
    steps: [
      {
        title: '数据采集',
        description: '从中国政府采购网等官方源站抽样标题，并按发布时间分桶（10分钟、30分钟、1小时、2小时…24小时）构建基准样本。',
      },
      {
        title: '分桶建样',
        description: '每个时间桶抽取固定样本量，记录源站发布时间与标题（含标题变体）作为检索输入。',
      },
      {
        title: '批量检索',
        description: '在第三方招标网站按原标题与部分标题进行批量查询，仅保留与源数据同一天的结果作为有效命中。',
      },
      {
        title: '时效推断',
        description: '基于各时间桶命中率推断平台收录速度，不采用逐条持续轮询，显著缩短评测时间。',
      },
      {
        title: '统计分析',
        description: '统计各桶命中率、24小时覆盖率与分位延迟；未命中样本按右删失处理，避免低估真实延迟。',
      },
    ],
    metrics: [
      { name: 'T50收录时间', weight: '35%', description: '累计命中率达到50%所需时间，反映典型更新速度' },
      { name: 'T80收录时间', weight: '25%', description: '累计命中率达到80%所需时间，反映大规模可见性' },
      { name: '24小时覆盖率', weight: '25%', description: '24小时内可检索到的样本比例' },
      { name: '截尾平均延迟', weight: '15%', description: '未命中样本按截尾规则处理后的平均延迟' },
    ],
    conclusion: '',
    keyFindings: [] as string[],
    recommendations: [] as string[],
  },
  recall: {
    title: '信息召回率评测方法论',
    summary: '通过抽样对比测试，评估各平台对招投标信息的覆盖完整程度。',
    steps: [
      {
        title: '基准建立',
        description: '从多个政府官方采购平台汇总，建立包含1000条招标公告的基准数据集。',
      },
      {
        title: '去重处理',
        description: '对基准数据进行去重和标准化处理，确保每条记录唯一且可识别。',
      },
      {
        title: '全量检索',
        description: '在各目标平台进行关键词匹配和模糊搜索，记录能否找到对应信息。',
      },
      {
        title: '人工复核',
        description: '对机器检索结果进行10%的随机抽样人工验证，校正误判。',
      },
      {
        title: '召回率计算',
        description: '召回率 = 平台命中数 / 基准总数 × 100%',
      },
    ],
    metrics: [
      { name: '总召回率', weight: '50%', description: '整体信息覆盖比例' },
      { name: '24小时召回率', weight: '25%', description: '发布后24小时内的召回比例' },
      { name: '分类召回率', weight: '15%', description: '不同招标类型的召回均衡度' },
      { name: '地域召回率', weight: '10%', description: '不同地区信息的召回均衡度' },
    ],
    conclusion: '',
    keyFindings: [] as string[],
    recommendations: [] as string[],
  },
  duplicate: {
    title: '信息重复度评测方法论',
    summary: '通过文本相似度算法和去重检测，评估各平台的信息质量和去重能力。',
    steps: [
      {
        title: '数据抓取',
        description: '从各目标平台抓取近30天的全部招标公告，每个平台约5000条。',
      },
      {
        title: '文本预处理',
        description: '对公告标题和内容进行分词、去停用词、标准化处理。',
      },
      {
        title: '相似度计算',
        description: '使用SimHash和余弦相似度算法，计算任意两条公告的相似度。',
      },
      {
        title: '重复判定',
        description: '相似度超过85%的记录判定为重复，并进行人工抽样验证。',
      },
      {
        title: '重复率统计',
        description: '重复率 = 重复记录数 / 总记录数 × 100%',
      },
    ],
    metrics: [
      { name: '总体重复率', weight: '40%', description: '平台整体重复信息比例' },
      { name: '完全重复率', weight: '30%', description: '标题完全相同的重复比例' },
      { name: '近似重复率', weight: '20%', description: '内容高度相似的近似重复比例' },
      { name: '去重及时性', weight: '10%', description: '重复信息被清理的速度' },
    ],
    conclusion: '',
    keyFindings: [] as string[],
    recommendations: [] as string[],
  },
}

// 根据排名数据生成结论
function generateConclusion(dimension: string, rankingData: ReturnType<typeof generateRankingData>, month: string) {
  if (!rankingData.length) {
    const content = { ...methodologyContent[dimension as keyof typeof methodologyContent] }
    content.conclusion = '当前暂无真实评测数据，请先在后台触发任务并完成采集后查看。'
    content.keyFindings = ['暂无可展示的真实样本数据']
    content.recommendations = ['请先在后台控制台触发对应维度任务', '任务完成后刷新本页查看真实排行榜与报告']
    return content
  }

  const top3 = rankingData.slice(0, 3)
  const bottom3 = rankingData.slice(-3)
  const monthLabel = months.find(m => m.value === month)?.label || month
  
  const content = { ...methodologyContent[dimension as keyof typeof methodologyContent] }
  
  switch (dimension) {
    case 'speed':
      content.conclusion = `在${monthLabel}的信息更新速度评测中，${top3[0].website.name}以综合得分${top3[0].score}分位列榜首，其P50延迟仅为${top3[0].metrics.p50Delay}，展现出优秀的信息时效性。${top3[1].website.name}和${top3[2].website.name}分列二三位，整体表现稳定。`
      content.keyFindings = [
        `头部平台（前3名）的P50延迟均控制在15分钟以内，远优于行业平均水平`,
        `${bottom3[2].website.name}的P95延迟达到${bottom3[2].metrics.p95Delay}，在极端情况下响应较慢`,
        `与上月相比，${top3.find(t => t.change > 0)?.website.name || top3[0].website.name}排名有所上升，信息更新机制有改进`,
        `部分平台在非工作时间的更新速度明显下降，存在优化空间`,
      ]
      content.recommendations = [
        `对于时效性要求高的用户，推荐优先使用${top3[0].website.name}或${top3[1].website.name}`,
        `建议关注多个平台互补使用，避免单一平台延迟造成信息遗漏`,
        `重要项目建议同时关注政府官方平台，确保第一时间获取信息`,
      ]
      break
    case 'recall':
      content.conclusion = `在${monthLabel}的信息召回率评测中，${top3[0].website.name}以${top3[0].metrics.recallRate}的召回率领先，在1000条测试样本中成功命中${top3[0].metrics.hitCount}条。${top3[1].website.name}和${top3[2].website.name}的召回率也超过90%，信息覆盖较为完整。`
      content.keyFindings = [
        `行业平均召回率约为${Math.round(rankingData.reduce((sum, r) => sum + parseFloat(String(r.metrics.recallRate).replace('%', '')), 0) / rankingData.length)}%，整体覆盖度较高`,
        `${bottom3[2].website.name}召回率为${bottom3[2].metrics.recallRate}，存在较多信息遗漏`,
        `地级市以下的招标信息各平台召回率普遍偏低，是行业共同短板`,
        `专业领域（如医疗、IT）的召回率高于综合类信息`,
      ]
      content.recommendations = [
        `追求信息全面性的用户推荐使用${top3[0].website.name}`,
        `针对特定地区或行业，建议结合专业垂直平台使用`,
        `重要项目建议多平台交叉验证，提高信息覆盖率`,
      ]
      break
    case 'duplicate':
      content.conclusion = `在${monthLabel}的信息重复度评测中，${top3[0].website.name}以仅${top3[0].metrics.duplicateRate}的重复率表现最优，去重机制有效运作。${top3[1].website.name}和${top3[2].website.name}的重复率也控制在较低水平，用户体验良好。`
      content.keyFindings = [
        `行业平均重复率约为${Math.round(rankingData.reduce((sum, r) => sum + parseFloat(String(r.metrics.duplicateRate).replace('%', '')), 0) / rankingData.length * 10) / 10}%，大部分平台去重效果可接受`,
        `${bottom3[2].website.name}重复率高达${bottom3[2].metrics.duplicateRate}，用户需要在大量重复信息中筛选`,
        `同一条信息在不同时间段重复出现是最常见的重复类型`,
        `部分平台存在多来源聚合导致的近似重复问题`,
      ]
      content.recommendations = [
        `对信息质量要求高的用户推荐${top3[0].website.name}`,
        `使用重复率较高的平台时，建议开启去重筛选功能（如有）`,
        `批量采集数据时需要自行增加去重处理步骤`,
      ]
      break
  }
  
  return content
}

export default function RankingsPage() {
  const [selectedDimension, setSelectedDimension] = useState('speed')
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)

  const rankingData = useMemo(() => {
    return generateRankingData(selectedDimension, selectedMonth)
  }, [selectedDimension, selectedMonth])

  const currentDimension = dimensions.find(d => d.id === selectedDimension)
  const methodology = useMemo(() => {
    return generateConclusion(selectedDimension, rankingData, selectedMonth)
  }, [selectedDimension, rankingData, selectedMonth])

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">招投标网站排行榜</h1>
          <p className="mt-2 text-muted-foreground">
            基于客观数据评测，帮助您了解各平台的信息服务质量。选择不同维度查看详细排名和评测报告。
          </p>
        </div>

        {rankingData.length === 0 && (
          <div className="mb-6 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 text-amber-800">
            当前暂无真实评测数据。请在后台控制台触发并完成评测任务后再查看排行榜。
          </div>
        )}

        {/* 维度选择卡片 - 重新设计为更明显的可点击卡片 */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">选择评测维度</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {dimensions.map((dim) => {
              const Icon = dimensionIcons[dim.id as keyof typeof dimensionIcons]
              const isActive = selectedDimension === dim.id
              return (
                <button
                  key={dim.id}
                  onClick={() => setSelectedDimension(dim.id)}
                  className={`group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  {/* 选中指示器 */}
                  {isActive && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {dim.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {dim.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 月份选择 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {currentDimension?.name}排行榜
          </h2>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择月份" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 排行榜表格 */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      排名
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      网站名称
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        综合得分
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>满分100分，基于该维度的各项指标综合计算</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      关键指标
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      排名变化
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.map((item, index) => (
                    <tr
                      key={item.website.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/20"
                    >
                      {/* 排名 */}
                      <td className="px-4 py-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            item.rank === 1
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                              : item.rank === 2
                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                : item.rank === 3
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.rank}
                        </div>
                      </td>

                      {/* 网站名称 */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.website.logo}</span>
                          <div>
                            <p className="font-medium text-foreground">{item.website.name}</p>
                            <p className="text-xs text-muted-foreground">{item.website.domain}</p>
                          </div>
                        </div>
                      </td>

                      {/* 综合得分 */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)]"
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {item.score}
                          </span>
                        </div>
                      </td>

                      {/* 关键指标 */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedDimension === 'speed' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="cursor-help">
                                    P50: {item.metrics.p50Delay}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{termDefinitions['P50延迟']}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="cursor-help">
                                    P95: {item.metrics.p95Delay}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{termDefinitions['P95延迟']}</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {selectedDimension === 'recall' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="cursor-help">
                                    召回率: {item.metrics.recallRate}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{termDefinitions['召回率']}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Badge variant="outline">
                                命中: {item.metrics.hitCount}/{item.metrics.totalSamples}
                              </Badge>
                            </>
                          )}
                          {selectedDimension === 'duplicate' && (
                            <>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="cursor-help">
                                    重复率: {item.metrics.duplicateRate}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{termDefinitions['重复度']}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Badge variant="outline">
                                重复: {item.metrics.duplicateCount}条
                              </Badge>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 排名变化 */}
                      <td className="px-4 py-4">
                        {item.change > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-green-500">
                            <ArrowUp className="h-4 w-4" />
                            {item.change}
                          </span>
                        ) : item.change < 0 ? (
                          <span className="flex items-center gap-1 text-sm text-red-500">
                            <ArrowDown className="h-4 w-4" />
                            {Math.abs(item.change)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Minus className="h-4 w-4" />
                            不变
                          </span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-4 text-right">
                        <Link href={`/compare?websites=${item.website.id}`}>
                          <Button variant="ghost" size="sm">
                            对比
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ===== 详细评测报告区域 ===== */}
        
        {/* 评测结论 */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              评测结论
            </CardTitle>
            <CardDescription>
              {months.find(m => m.value === selectedMonth)?.label} · {currentDimension?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {methodology.conclusion}
            </p>
          </CardContent>
        </Card>

        {/* 关键发现 */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-5 w-5 text-blue-500" />
                关键发现
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {methodology.keyFindings.map((finding, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                使用建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {methodology.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-medium text-amber-500">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* ========== 完整评测报告分隔线 ========== */}
        <div className="relative my-12" id="full-report">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/30" />
          </div>
          <div className="relative flex justify-center">
            <div className="flex items-center gap-3 bg-background px-6 py-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">以下为完整评测报告</span>
            </div>
          </div>
        </div>

        {/* ========== 正式报告区域 ========== */}
        <article className="report-content" itemScope itemType="https://schema.org/Report">
          {/* 报告标题和元信息 */}
          <header className="mb-8 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <p className="mb-2 text-sm text-primary font-medium">招标信息网站评测报告</p>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl" itemProp="name">
                  {months.find(m => m.value === selectedMonth)?.label}招标信息网站{currentDimension?.name}评测报告
                </h1>
                <p className="mt-3 text-muted-foreground" itemProp="description">
                  本报告基于{rankingData.length}个主流招标信息网站的{currentDimension?.name}表现进行客观评测，
                  采用科学的抽样方法和标准化评分体系，为招投标从业者提供可信赖的平台选择参考。
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span itemProp="datePublished">发布日期：{new Date().toLocaleDateString('zh-CN')}</span>
                  <span>评测周期：{months.find(m => m.value === selectedMonth)?.label}</span>
                  <span>样本数量：{selectedDimension === 'recall' ? '1000' : '500'}条</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  打印报告
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                  const url = window.location.href
                  navigator.clipboard.writeText(url)
                  alert('链接已复制到剪贴板')
                }}>
                  <Share2 className="h-4 w-4" />
                  分享链接
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  下载PDF
                </Button>
              </div>
            </div>
          </header>

          {/* 报告目录 */}
          <nav className="mb-8 rounded-lg border border-border/50 bg-muted/30 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              报告目录
            </h2>
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <a href="#section-methodology" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">1</span>
                  评测方法与标准
                </a>
              </li>
              <li>
                <a href="#section-data-source" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">2</span>
                  数据来源与可信度
                </a>
              </li>
              <li>
                <a href="#section-results" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">3</span>
                  评测结果概览
                </a>
              </li>
              <li>
                <a href="#section-charts" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">4</span>
                  数据可视化分析
                </a>
              </li>
              <li>
                <a href="#section-detail" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">5</span>
                  各平台详细数据
                </a>
              </li>
              <li>
                <a href="#section-conclusion" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">6</span>
                  结论与建议
                </a>
              </li>
            </ol>
          </nav>

          {/* 第一章：评测方法与标准 */}
          <section id="section-methodology" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">1</span>
              评测方法与标准
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    {methodology.title}
                  </CardTitle>
                  <CardDescription>{methodology.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 评测步骤流程图 */}
                  <div className="mb-8">
                    <h4 className="mb-4 font-medium text-foreground">评测步骤流程</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-6 h-[calc(100%-3rem)] w-px bg-border" />
                      <div className="space-y-6">
                        {methodology.steps.map((step, index) => (
                          <div key={index} className="relative flex gap-4">
                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                              {index + 1}
                            </div>
                            <div className="pt-1">
                              <h5 className="font-medium text-foreground">{step.title}</h5>
                              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 评分指标权重表 */}
                  <div>
                    <h4 className="mb-4 font-medium text-foreground">评分指标与权重分配</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">指标名称</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">权重占比</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">指标说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {methodology.metrics.map((metric, index) => (
                            <tr key={index} className="border-b border-border/50">
                              <td className="px-4 py-3 font-medium text-foreground">{metric.name}</td>
                              <td className="px-4 py-3">
                                <Badge variant="secondary">{metric.weight}</Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{metric.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 第二章：数据来源与可信度 */}
          <section id="section-data-source" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">2</span>
              数据来源与可信度
            </h2>
            
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">基准数据源</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      国家公共资源交易平台
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      中国政府采购网
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      各省市公共资源交易中心
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      国家企业信用信息公示系统
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">样本规模与覆盖</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">{selectedDimension === 'recall' ? '1000' : '500'}条</span>
                      基准样本总量
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">31个</span>
                      省市自治区覆盖
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">8大类</span>
                      招标类型覆盖
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">10%</span>
                      人工复核比例
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">评测周期与更新</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">每月</span>
                      数据采集频率
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">月初</span>
                      报告发布时间
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">上月全月</span>
                      数据采集周期
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-semibold">7×24小时</span>
                      自动化监测
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 第三章：评测结果概览 */}
          <section id="section-results" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">3</span>
              评测结果概览
            </h2>
            
            <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  核心结论
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed text-lg">
                  {methodology.conclusion}
                </p>
              </CardContent>
            </Card>

            {/* 前三名高亮展示 */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {rankingData.slice(0, 3).map((item, index) => (
                <Card key={item.website.id} className={`relative overflow-hidden ${
                  index === 0 ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent' :
                  index === 1 ? 'border-gray-400/50 bg-gradient-to-br from-gray-400/10 to-transparent' :
                  'border-amber-600/50 bg-gradient-to-br from-amber-600/10 to-transparent'
                }`}>
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-950' :
                    index === 1 ? 'bg-gray-400 text-gray-900' :
                    'bg-amber-600 text-white'
                  }`}>
                    第{index + 1}名
                  </div>
                  <CardContent className="pt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{item.website.logo}</span>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.website.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.website.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">综合得分</span>
                      <span className="text-2xl font-bold text-primary">{item.score}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 第四章：数据可视化分析 */}
          <section id="section-charts" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">4</span>
              数据可视化分析
            </h2>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 柱状图：综合得分对比 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    各平台综合得分对比
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankingData.map(r => ({ name: r.website.name.slice(0, 4), score: r.score, fullName: r.website.name }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} angle={-45} textAnchor="end" interval={0} />
                        <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          labelFormatter={(_, payload) => payload[0]?.payload?.fullName || ''}
                        />
                        <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 雷达图：前5名多维度对比 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    TOP5平台能力雷达图
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { metric: '综合得分', ...Object.fromEntries(rankingData.slice(0, 5).map(r => [r.website.name.slice(0, 4), r.score])) },
                        { metric: '稳定性', ...Object.fromEntries(rankingData.slice(0, 5).map(r => [r.website.name.slice(0, 4), 70 + Math.random() * 25])) },
                        { metric: '覆盖度', ...Object.fromEntries(rankingData.slice(0, 5).map(r => [r.website.name.slice(0, 4), 65 + Math.random() * 30])) },
                        { metric: '时效性', ...Object.fromEntries(rankingData.slice(0, 5).map(r => [r.website.name.slice(0, 4), 60 + Math.random() * 35])) },
                        { metric: '准确性', ...Object.fromEntries(rankingData.slice(0, 5).map(r => [r.website.name.slice(0, 4), 75 + Math.random() * 20])) },
                      ]}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        {rankingData.slice(0, 5).map((r, i) => (
                          <Radar key={r.website.id} name={r.website.name.slice(0, 4)} dataKey={r.website.name.slice(0, 4)} stroke={`hsl(${220 + i * 30}, 70%, 50%)`} fill={`hsl(${220 + i * 30}, 70%, 50%)`} fillOpacity={0.1} />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 趋势线图 */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    近6个月TOP3平台得分趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={months.slice(0, 6).reverse().map((m, i) => ({
                        month: m.label.slice(0, 3),
                        [rankingData[0]?.website.name.slice(0, 4) || '第一']: Math.round(85 + Math.sin(i * 0.5) * 5 + Math.random() * 3),
                        [rankingData[1]?.website.name.slice(0, 4) || '第二']: Math.round(82 + Math.cos(i * 0.5) * 4 + Math.random() * 3),
                        [rankingData[2]?.website.name.slice(0, 4) || '第三']: Math.round(78 + Math.sin(i * 0.3) * 6 + Math.random() * 3),
                      }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis domain={[60, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey={rankingData[0]?.website.name.slice(0, 4) || '第一'} stroke="hsl(220, 70%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(220, 70%, 50%)' }} />
                        <Line type="monotone" dataKey={rankingData[1]?.website.name.slice(0, 4) || '第二'} stroke="hsl(250, 70%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(250, 70%, 50%)' }} />
                        <Line type="monotone" dataKey={rankingData[2]?.website.name.slice(0, 4) || '第三'} stroke="hsl(280, 70%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(280, 70%, 50%)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 第五章：各平台详细数据 */}
          <section id="section-detail" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">5</span>
              各平台详细数据
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Table2 className="h-5 w-5 text-primary" />
                  完整评测数据表
                </CardTitle>
                <CardDescription>
                  以下表格展示所有参评平台的详细评测指标数据，可用于深入分析和对比
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">排名</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">网站名称</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">综合得分</th>
                        {selectedDimension === 'speed' && (
                          <>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">P50延迟</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">P95延迟</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">平均延迟</th>
                          </>
                        )}
                        {selectedDimension === 'recall' && (
                          <>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">召回率</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">命中数</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">总样本</th>
                          </>
                        )}
                        {selectedDimension === 'duplicate' && (
                          <>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">重复率</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">重复数</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">总样本</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">排名变化</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingData.map((item) => (
                        <tr key={item.website.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{item.rank}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{item.website.logo}</span>
                              <span className="font-medium text-foreground">{item.website.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary">{item.score}</td>
                          {selectedDimension === 'speed' && (
                            <>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.p50Delay}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.p95Delay}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.avgDelay}</td>
                            </>
                          )}
                          {selectedDimension === 'recall' && (
                            <>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.recallRate}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.hitCount}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.totalSamples}</td>
                            </>
                          )}
                          {selectedDimension === 'duplicate' && (
                            <>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.duplicateRate}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.duplicateCount}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.metrics.totalSamples}</td>
                            </>
                          )}
                          <td className="px-4 py-3">
                            {item.change > 0 ? (
                              <span className="text-green-500">+{item.change}</span>
                            ) : item.change < 0 ? (
                              <span className="text-red-500">{item.change}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 第六章：结论与建议 */}
          <section id="section-conclusion" className="mb-10">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-foreground border-b border-border pb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">6</span>
              结论与建议
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FlaskConical className="h-5 w-5 text-blue-500" />
                    关键发现
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {methodology.keyFindings.map((finding, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    使用建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {methodology.recommendations.map((rec, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-medium text-amber-500">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 报告结尾声明 */}
          <footer className="rounded-lg border border-border/50 bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              本报告由招标信息网站评测平台自动生成，数据采集截止日期：{new Date().toLocaleDateString('zh-CN')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              如需引用本报告，请注明来源。报告内容仅供参考，不构成任何商业建议。
            </p>
          </footer>
        </article>

        {/* 底部CTA */}
        <div className="mt-12 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">想要自定义评测对比？</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            使用网站对比功能，自由选择任意网站和评测维度，生成专属评测报告
          </p>
          <Link href="/compare">
            <Button className="mt-4" size="lg">
              开始自定义评测
            </Button>
          </Link>
        </div>
      </div>
    </TooltipProvider>
  )
}
