import { BarChart3 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)]">
              <BarChart3 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">招标评测</span>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            专业的招投标网站评测对比平台，帮助您选择最适合的信息服务
          </p>
          
          <p className="text-xs text-muted-foreground">
            演示原型 - 数据仅供参考
          </p>
        </div>
      </div>
    </footer>
  )
}
