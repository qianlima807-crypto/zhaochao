'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { websites, periodOptions, infoTypes, dimensions } from '@/lib/mock-data'
import { 
  GitCompare, 
  AlertCircle, 
  Play, 
  X,
  Calendar,
  FileText,
  Target
} from 'lucide-react'

export default function ComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoggedIn, isLoading } = useAuth()
  
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([])
  const [period, setPeriod] = useState('7d')
  const [infoType, setInfoType] = useState('bidding')
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['speed', 'recall', 'duplicate'])

  // 从URL参数初始化选中的网站
  useEffect(() => {
    const websitesParam = searchParams.get('websites')
    if (websitesParam) {
      setSelectedWebsites(websitesParam.split(',').filter(id => websites.some(w => w.id === id)))
    }
  }, [searchParams])

  // 未登录时跳转到登录页（等待加载完成后再检查）
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/compare')
    }
  }, [isLoggedIn, isLoading, router])

  const toggleWebsite = (websiteId: string) => {
    setSelectedWebsites(prev => {
      if (prev.includes(websiteId)) {
        return prev.filter(id => id !== websiteId)
      }
      if (prev.length >= 10) {
        return prev
      }
      return [...prev, websiteId]
    })
  }

  const toggleDimension = (dimensionId: string) => {
    setSelectedDimensions(prev => {
      if (prev.includes(dimensionId)) {
        if (prev.length === 1) return prev // 至少保留一个
        return prev.filter(id => id !== dimensionId)
      }
      return [...prev, dimensionId]
    })
  }

  const handleStartCompare = () => {
    const params = new URLSearchParams({
      websites: selectedWebsites.join(','),
      period,
      infoType,
      dimensions: selectedDimensions.join(','),
    })
    router.push(`/compare/loading?${params.toString()}`)
  }

  const canStartCompare = selectedWebsites.length >= 2 && selectedDimensions.length >= 1

  // 加载中或未登录时显示加载状态
  if (isLoading || !isLoggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              {isLoading ? '正在加载...' : '正在跳转到登录页面...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">网站对比评测</h1>
        <p className="mt-2 text-muted-foreground">
          选择要对比的网站和评测维度，系统将自动进行测试并生成详细报告
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：网站选择 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <GitCompare className="h-5 w-5 text-primary" />
                    选择对比网站
                  </CardTitle>
                  <CardDescription>
                    选择 2-10 个网站进行对比评测
                  </CardDescription>
                </div>
                <Badge variant={selectedWebsites.length >= 2 ? 'default' : 'secondary'}>
                  已选 {selectedWebsites.length}/10
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {websites.map((website) => {
                  const isSelected = selectedWebsites.includes(website.id)
                  return (
                    <button
                      key={website.id}
                      onClick={() => toggleWebsite(website.id)}
                      className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      } ${
                        !isSelected && selectedWebsites.length >= 10
                          ? 'cursor-not-allowed opacity-50'
                          : ''
                      }`}
                      disabled={!isSelected && selectedWebsites.length >= 10}
                    >
                      <span className="text-2xl">{website.logo}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{website.name}</p>
                        <p className="text-xs text-muted-foreground">{website.domain}</p>
                      </div>
                      {isSelected && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <span className="text-xs font-bold">
                            {selectedWebsites.indexOf(website.id) + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* 已选网站标签 */}
              {selectedWebsites.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {selectedWebsites.map((id) => {
                    const website = websites.find(w => w.id === id)
                    if (!website) return null
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {website.name}
                        <button
                          onClick={() => toggleWebsite(id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：配置选项 */}
        <div className="space-y-6">
          {/* 对比周期 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                对比周期
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={period} onValueChange={setPeriod}>
                {periodOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`period-${option.value}`} />
                    <Label htmlFor={`period-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 信息类型 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                信息类型
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={infoType} onValueChange={setInfoType}>
                {infoTypes.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`type-${option.value}`} />
                    <Label htmlFor={`type-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 评测维度 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                评测维度
              </CardTitle>
              <CardDescription className="text-xs">至少选择一个维度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dimensions.map((dim) => (
                  <div key={dim.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`dim-${dim.id}`}
                      checked={selectedDimensions.includes(dim.id)}
                      onCheckedChange={() => toggleDimension(dim.id)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={`dim-${dim.id}`} className="cursor-pointer">
                        {dim.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 开始对比按钮 */}
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] text-white hover:opacity-90"
            disabled={!canStartCompare}
            onClick={handleStartCompare}
          >
            <Play className="mr-2 h-4 w-4" />
            开始对比评测
          </Button>

          {!canStartCompare && (
            <p className="text-center text-sm text-muted-foreground">
              {selectedWebsites.length < 2
                ? `还需选择 ${2 - selectedWebsites.length} 个网站`
                : '请至少选择一个评测维度'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
