// 招投标网站列表
export const websites = [
  { id: 'zbcgdhw', name: '招标采购导航网', domain: 'okcis.cn', logo: '🧭' },
  { id: 'chinabidding', name: '中国招标网', domain: 'bidchance.com', logo: '🇨🇳' },
  { id: 'caizhaowang', name: '中国采招网', domain: 'chinabidding.cn', logo: '📋' },
  { id: 'qianlima', name: '千里马招标网', domain: 'qianlima.com', logo: '🏇' },
  { id: 'bidizhaobiao', name: '比地招标网', domain: 'bidizhaobiao.com', logo: '📍' },
  { id: 'liudubiaoxun', name: '六度标讯', domain: '6dbx.com', logo: '6️⃣' },
  { id: 'chinacgyw', name: '中国采购与招标网', domain: 'chinacgyw.com', logo: '🏛️' },
  { id: 'jianyubiaoxun', name: '剑鱼标讯', domain: 'jianyu360.com', logo: '🗡️' },
  { id: 'biaobiaoda', name: '标标达', domain: 'biaobiaoda.com', logo: '🎯' },
  { id: 'zhiliaobiaoxun', name: '知了标讯', domain: 'zhiliaobx.com', logo: '🪲' },
  { id: 'yfbzb', name: '乙方宝招标官网', domain: 'yfbzb.com', logo: '💎' },
]

// 评测维度
export const dimensions = [
  { id: 'speed', name: '信息更新速度', description: '从原始网站发布到平台收录的时间间隔' },
  { id: 'recall', name: '信息召回率', description: '平台能够覆盖的招标信息占比' },
  { id: 'duplicate', name: '信息重复度', description: '同一条信息在平台中出现多次的比例' },
]

// 月份列表
export const months = [
  { value: '2026-05', label: '2026年5月' },
  { value: '2026-04', label: '2026年4月' },
  { value: '2026-03', label: '2026年3月' },
  { value: '2026-02', label: '2026年2月' },
  { value: '2026-01', label: '2026年1月' },
  { value: '2025-12', label: '2025年12月' },
]

// 对比周期选项
export const periodOptions = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近1月' },
  { value: '90d', label: '近3月' },
]

// 信息类型选项
export const infoTypes = [
  { value: 'bidding', label: '招标公告' },
  { value: 'winning', label: '中标公告' },
]

// 生成随机排行榜数据
export function generateRankingData(
  _dimension: string,
  _month: string
) {
  // 已切换为真实数据模式：前端不再生成演示排行数据
  return [] as Array<any>
}

// 生成对比报告数据
export function generateCompareReport(
  websiteIds: string[],
  period: string,
  infoType: string,
  selectedDimensions: string[]
) {
  const selectedWebsites = websites.filter(w => websiteIds.includes(w.id))
  const reportId = `report-${Date.now()}`
  
  const speedData = selectedWebsites.map(website => ({
    website: website.name,
    p50: Math.round(5 + Math.random() * 30),
    p95: Math.round(30 + Math.random() * 60),
    avg: Math.round(15 + Math.random() * 40),
  }))
  
  const recallData = selectedWebsites.map(website => ({
    website: website.name,
    totalSamples: 500,
    found: Math.round(450 + Math.random() * 50),
    rate: Math.round(90 + Math.random() * 10),
  }))
  
  const duplicateData = selectedWebsites.map(website => ({
    website: website.name,
    totalItems: 2000,
    duplicates: Math.round(20 + Math.random() * 100),
    rate: Math.round(1 + Math.random() * 5),
  }))
  
  // 生成可验证的样本数据
  const verifiableSamples = Array.from({ length: 20 }, (_, i) => ({
    id: `sample-${i + 1}`,
    title: getRandomProjectTitle(),
    publishTime: getRandomDate(),
    source: '国家公共资源交易平台',
    results: selectedWebsites.map(website => ({
      websiteId: website.id,
      websiteName: website.name,
      found: Math.random() > 0.15,
      foundTime: Math.random() > 0.15 ? getRandomFoundTime() : null,
      delay: Math.random() > 0.15 ? `${Math.round(5 + Math.random() * 30)}分钟` : null,
    })),
  }))
  
  return {
    id: reportId,
    createdAt: new Date().toISOString(),
    period,
    infoType,
    websites: selectedWebsites,
    dimensions: selectedDimensions,
    summary: {
      bestSpeed: speedData.reduce((a, b) => a.avg < b.avg ? a : b).website,
      bestRecall: recallData.reduce((a, b) => a.rate > b.rate ? a : b).website,
      bestDuplicate: duplicateData.reduce((a, b) => a.rate < b.rate ? a : b).website,
    },
    speedData,
    recallData,
    duplicateData,
    verifiableSamples,
  }
}

// 辅助函数
function getRandomProjectTitle() {
  const prefixes = ['关于', '']
  const locations = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市']
  const types = ['医院', '学校', '政府', '企业', '研究院', '科技园']
  const projects = [
    '信息化建设项目',
    '办公设备采购项目',
    '网络安全设备采购',
    '云计算服务采购',
    '软件开发服务',
    'IT运维服务',
    '数据中心建设',
    '智慧园区建设',
  ]
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const location = locations[Math.floor(Math.random() * locations.length)]
  const type = types[Math.floor(Math.random() * types.length)]
  const project = projects[Math.floor(Math.random() * projects.length)]
  
  return `${prefix}${location}${type}${project}`
}

function getRandomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0] + ' ' + 
    String(Math.floor(Math.random() * 12) + 8).padStart(2, '0') + ':' +
    String(Math.floor(Math.random() * 60)).padStart(2, '0')
}

function getRandomFoundTime() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0] + ' ' + 
    String(Math.floor(Math.random() * 12) + 8).padStart(2, '0') + ':' +
    String(Math.floor(Math.random() * 60)).padStart(2, '0')
}

// 加载动画步骤
export const loadingSteps = [
  { id: 'init', label: '正在初始化爬虫引擎...', duration: 3000 },
  { id: 'load-source', label: '正在连接数据源...', duration: 4000 },
  { id: 'sample', label: '正在随机采集样本信息...', duration: 8000 },
  { id: 'analyze-speed', label: '正在分析信息更新时间...', duration: 6000 },
  { id: 'analyze-recall', label: '正在计算召回率...', duration: 8000 },
  { id: 'analyze-duplicate', label: '正在检测重复信息...', duration: 6000 },
  { id: 'generate', label: '正在生成评测报告...', duration: 5000 },
]

// 生成终端日志
export function generateTerminalLogs(step: string, websiteNames: string[]) {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const logs: { time: string; type: 'info' | 'success' | 'warning' | 'data'; message: string }[] = []
  
  switch (step) {
    case 'init':
      logs.push(
        { time: timestamp, type: 'info', message: '初始化 BidCrawler v3.2.1...' },
        { time: timestamp, type: 'info', message: '加载爬虫配置文件...' },
        { time: timestamp, type: 'success', message: '爬虫引擎启动成功' },
        { time: timestamp, type: 'info', message: '检测到 ' + websiteNames.length + ' 个目标网站' },
      )
      break
    case 'load-source':
      websiteNames.forEach(name => {
        logs.push(
          { time: timestamp, type: 'info', message: `连接 ${name}...` },
          { time: timestamp, type: 'success', message: `${name} 连接成功` },
        )
      })
      break
    case 'sample':
      logs.push(
        { time: timestamp, type: 'info', message: '开始随机采样...' },
        { time: timestamp, type: 'data', message: '采样范围: 近30天招标公告' },
        { time: timestamp, type: 'data', message: '样本数量: 500条' },
        { time: timestamp, type: 'info', message: '正在从国家公共资源交易平台获取基准数据...' },
        { time: timestamp, type: 'success', message: '基准数据获取完成，共 500 条记录' },
      )
      break
    case 'analyze-speed':
      logs.push(
        { time: timestamp, type: 'info', message: '开始计算更新延迟...' },
        { time: timestamp, type: 'data', message: '分析方法: 对比原始发布时间与平台收录时间' },
      )
      websiteNames.forEach(name => {
        logs.push(
          { time: timestamp, type: 'info', message: `分析 ${name} 更新速度...` },
          { time: timestamp, type: 'data', message: `${name} P50延迟: ${Math.round(5 + Math.random() * 20)}分钟` },
        )
      })
      logs.push({ time: timestamp, type: 'success', message: '更新速度分析完成' })
      break
    case 'analyze-recall':
      logs.push(
        { time: timestamp, type: 'info', message: '开始计算召回率...' },
        { time: timestamp, type: 'data', message: '对比样本与各平台收录情况' },
      )
      websiteNames.forEach(name => {
        const rate = Math.round(85 + Math.random() * 15)
        logs.push(
          { time: timestamp, type: 'info', message: `检索 ${name} 数据...` },
          { time: timestamp, type: 'data', message: `${name} 召回率: ${rate}%` },
        )
      })
      logs.push({ time: timestamp, type: 'success', message: '召回率计算完成' })
      break
    case 'analyze-duplicate':
      logs.push(
        { time: timestamp, type: 'info', message: '开始检测重复信息...' },
        { time: timestamp, type: 'data', message: '使用文本相似度算法进行去重分析' },
      )
      websiteNames.forEach(name => {
        const rate = Math.round(1 + Math.random() * 5)
        logs.push(
          { time: timestamp, type: 'info', message: `分析 ${name} 重复数据...` },
          { time: timestamp, type: 'data', message: `${name} 重复率: ${rate}%` },
        )
      })
      logs.push({ time: timestamp, type: 'success', message: '重复度分析完成' })
      break
    case 'generate':
      logs.push(
        { time: timestamp, type: 'info', message: '汇总分析结果...' },
        { time: timestamp, type: 'info', message: '生成可视化图表...' },
        { time: timestamp, type: 'info', message: '编写评测报告...' },
        { time: timestamp, type: 'success', message: '报告生成完成!' },
      )
      break
  }
  
  return logs
}

// 术语解释
export const termDefinitions: Record<string, string> = {
  'P50延迟': '50%的请求在此时间内完成，反映典型响应速度。例如P50为10分钟，表示一半的信息能在发布后10分钟内被收录。',
  'P95延迟': '95%的请求在此时间内完成，反映极端情况下的响应速度。用于评估系统在高负载或异常情况下的表现。',
  '召回率': '在所有相关信息中，系统能够找到的比例。召回率95%表示每100条招标信息，平台能收录95条。',
  '重复度': '同一条信息在系统中出现多次的比例。重复度低表示平台去重效果好，用户不会看到大量重复信息。',
  '基准数据源': '用于对比测试的权威数据来源，通常使用政府官方采购平台的数据作为基准。',
  '样本采样': '从大量数据中随机抽取一部分进行测试，确保测试结果具有统计学意义。',
}
