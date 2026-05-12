'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dimensions, months, generateRankingData, websites } from '@/lib/mock-data'
import {
  BarChart3,
  GitCompare,
  ArrowRight,
  Clock,
  Target,
  Copy,
  Trophy,
  TrendingUp,
  Zap,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: '实时更新速度监测',
    description: '追踪各平台信息收录的及时性，帮助您选择更新最快的服务',
  },
  {
    icon: Target,
    title: '信息覆盖率评估',
    description: '评测各平台的信息召回能力，确保您不会错过重要招标信息',
  },
  {
    icon: Shield,
    title: '数据去重能力分析',
    description: '检测平台的去重效果，避免重复信息干扰您的决策',
  },
]

const dimensionIcons = {
  speed: Clock,
  recall: Target,
  duplicate: Copy,
}

export default function HomePage() {
  // 获取最新排行榜数据预览
  const latestRankings = useMemo(() => {
    return dimensions.map(dim => ({
      dimension: dim,
      data: generateRankingData(dim.id, months[0].value).slice(0, 3),
    }))
  }, [])

  return (
    <div className="relative">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[oklch(0.65_0.2_260)] opacity-10 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-[oklch(0.55_0.25_300)] opacity-10 blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              专业评测 客观数据
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              选择最适合您的
              <span className="bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] bg-clip-text text-transparent">
                招投标信息服务
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              基于实际测试数据，客观评测各大招投标网站的信息更新速度、覆盖范围和数据质量，
              帮助您做出明智的选择。
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/rankings">
                <Button size="lg" className="bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] text-white hover:opacity-90">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  查看排行榜
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline">
                  <GitCompare className="mr-2 h-5 w-5" />
                  自定义对比
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border/40 bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">三大评测维度</h2>
            <p className="mt-2 text-muted-foreground">全方位评估招投标信息服务质量</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)]">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Rankings Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">最新排行榜</h2>
              <p className="mt-2 text-muted-foreground">{months[0].label}评测数据</p>
            </div>
            <Link href="/rankings">
              <Button variant="ghost" className="gap-2">
                查看完整榜单
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {latestRankings.map(({ dimension, data }) => {
              const Icon = dimensionIcons[dimension.id as keyof typeof dimensionIcons]
              return (
                <Card key={dimension.id} className="gradient-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5 text-primary" />
                      {dimension.name}
                    </CardTitle>
                    <CardDescription className="text-xs">{dimension.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.map((item) => (
                        <div
                          key={item.website.id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              item.rank === 1
                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                : item.rank === 2
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                                  : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                            }`}
                          >
                            {item.rank}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {item.website.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.website.domain}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-semibold text-foreground">
                              {item.score}
                            </p>
                            {item.change > 0 ? (
                              <span className="flex items-center justify-end gap-0.5 text-xs text-green-500">
                                <ArrowUp className="h-3 w-3" />
                                {item.change}
                              </span>
                            ) : item.change < 0 ? (
                              <span className="flex items-center justify-end gap-0.5 text-xs text-red-500">
                                <ArrowDown className="h-3 w-3" />
                                {Math.abs(item.change)}
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                                <Minus className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href={`/rankings?dimension=${dimension.id}`}>
                      <Button variant="ghost" size="sm" className="mt-4 w-full">
                        查看完整榜单
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Compare Section */}
      <section className="border-t border-border/40 bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">快速开始对比</h2>
            <p className="mt-2 text-muted-foreground">
              选择您感兴趣的网站，立即生成详细的对比评测报告
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <Card className="gradient-border">
              <CardContent className="p-6">
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {websites.slice(0, 5).map((website) => (
                    <div
                      key={website.id}
                      className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-4 text-center"
                    >
                      <span className="text-3xl">{website.logo}</span>
                      <span className="text-xs font-medium text-foreground">{website.name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Link href="/compare">
                    <Button size="lg" className="bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] text-white hover:opacity-90">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      开始自定义对比
                    </Button>
                  </Link>
                  <p className="mt-3 text-sm text-muted-foreground">
                    支持 2-10 个网站同时对比，生成详细评测报告
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC0ydi00aDJ2NHptMC02di00aC0ydjRoMnptLTYgNmgtMnYtNGgydjR6bTAtNnYtNGgtMnY0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
            <div className="relative mx-auto max-w-2xl text-center text-white">
              <h2 className="text-3xl font-bold">准备好做出更明智的选择了吗？</h2>
              <p className="mt-4 text-white/80">
                立即开始使用我们的评测工具，找到最适合您需求的招投标信息服务。
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/rankings">
                  <Button size="lg" variant="secondary">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    查看排行榜
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <GitCompare className="mr-2 h-5 w-5" />
                    开始对比
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
