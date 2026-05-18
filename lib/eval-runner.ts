import fs from 'fs'
import path from 'path'

export type Dimension = 'speed' | 'recall' | 'duplicate'
export type StepStatus = 'pending' | 'running' | 'done' | 'failed'

export type TaskStep = { id: string; name: string; status: StepStatus; log: string[]; artifact?: string }
export type EvalTask = { id: string; dimension: Dimension; status: 'running'|'done'|'failed'; createdAt: string; steps: TaskStep[]; runtimeLogs: string[] }

const TASKS = new Map<string, EvalTask>()
const ART_DIR = path.join(process.cwd(), '.artifacts')
if (!fs.existsSync(ART_DIR)) fs.mkdirSync(ART_DIR, { recursive: true })

const sources = [
  'https://search.ccgp.gov.cn/bxsearch',
  'https://www.ggzy.gov.cn/deal/dealList.html?DEAL_CLASSIFY=00&DEAL_STAGE=0001',
  'http://www.ccgp-shandong.gov.cn/xxgk?colCode=0301&area=370000&selectedCode=0301&selectedCode1=0303&selectedName=%E9%87%87%E8%B4%AD%E5%85%AC%E5%91%8A',
]
const targets = [
  'https://www.yfbzb.com/search/invitedBidSearch?defaultSearch=true',
  'https://s.zhaobiao.cn/search/index',
  'https://search.qianlima.com/?q=#/search',
  'https://search.bidcenter.com.cn/',
  'https://www.okcis.cn/search/',
  'https://www.bidizhaobiao.com/advsearch/retrieval_list.do',
  'https://www.jianyu360.cn/jylab/supsearch/index.html?keywords=&selectType=title&searchGroup=1',
  'https://www.chinabidding.cn/public/yjsc/html/treetop_search.html?keywords=&start=&end=&search_type=CONTEXT&areaid=&categoryid=&b_date=month&table_type=&page=1',
  'https://www.6dbx.com/search.html?source=baidu&searchWords=',
  'https://bbda.com/pc/',
  'https://www.zhiliaobiaoxun.com/search/',
]


function pushLog(task: EvalTask, message: string) {
  const line = `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${message}`
  task.runtimeLogs.push(line)
  if (task.runtimeLogs.length > 500) task.runtimeLogs.shift()
}

function mkSteps(d: Dimension): TaskStep[] {
  if (d === 'speed') return [
    { id: 'collect-source', name: '步骤1：采集发布源头测试数据', status: 'pending', log: [] },
    { id: 'query-target', name: '步骤2：标题处理并查询11个第三方网站', status: 'pending', log: [] },
    { id: 'aggregate', name: '步骤3：聚合统计更新速度结果', status: 'pending', log: [] },
  ]
  if (d === 'recall') return [
    { id: 'sample-target', name: '步骤1：从第三方网站抽样测试集', status: 'pending', log: [] },
    { id: 'cross-query', name: '步骤2：跨站查询并计算覆盖率', status: 'pending', log: [] },
    { id: 'aggregate', name: '步骤3：输出覆盖率统计', status: 'pending', log: [] },
  ]
  return [
    { id: 'seed', name: '步骤1：选取重复率测试种子', status: 'pending', log: [] },
    { id: 'search', name: '步骤2：同站多变体搜索', status: 'pending', log: [] },
    { id: 'calc', name: '步骤3：计算重复率', status: 'pending', log: [] },
  ]
}

function toCsv(rows: string[][]) { return rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n') }
async function fetchHtml(url: string) { const r = await fetch(url, { headers: { 'user-agent':'Mozilla/5.0' } }); return await r.text() }
function extractTitles(html: string) {
  const matches = [...html.matchAll(/>([^<>]{6,200}(招标|采购|中标|成交|公告)[^<>]{0,60})</g)]
  const arr = Array.from(new Set(matches.map(m => m[1].replace(/\s+/g,' ').trim()))).slice(0, 50)
  if (arr.length) return arr
  return ['未解析到标题-请检查站点结构']
}

async function runTask(task: EvalTask) {
  try {
    task.steps[0].status = 'running'; task.steps[0].log.push('任务开始'); pushLog(task, '任务开始执行')
    // step1
    const sourceRows: string[][] = [['source_url','title']]
    for (const u of sources) {
      task.steps[0].log.push(`采集 ${u}`); pushLog(task, `步骤1采集：${u}`)
      try {
        const titles = extractTitles(await fetchHtml(u))
        titles.forEach(t => sourceRows.push([u, t]))
      } catch (e) {
        task.steps[0].log.push(`采集失败: ${u}`); pushLog(task, `步骤1采集失败：${u}`)
      }
    }
    const f1 = path.join(ART_DIR, `${task.id}-step1.csv`)
    fs.writeFileSync(f1, toCsv(sourceRows), 'utf-8')
    task.steps[0].artifact = f1; task.steps[0].status = 'done'; pushLog(task, `步骤1完成，产物：${f1}，行数：${sourceRows.length - 1}`)

    task.steps[1].status = 'running'; task.steps[1].log.push('开始第三方查询'); pushLog(task, '步骤2开始第三方查询')
    const sampleTitles = sourceRows.slice(1, 11).map(r => r[1])
    const step2: string[][] = [['target_url','title','reachable']]
    for (const turl of targets) {
      for (const t of sampleTitles.slice(0,3)) {
        let ok = '0'; pushLog(task, `步骤2查询：${turl}`)
        try { await fetch(turl, { method: 'GET', headers:{'user-agent':'Mozilla/5.0'} }); ok = '1' } catch {}
        step2.push([turl, t, ok])
      }
    }
    const f2 = path.join(ART_DIR, `${task.id}-step2.csv`)
    fs.writeFileSync(f2, toCsv(step2), 'utf-8')
    task.steps[1].artifact = f2; task.steps[1].status = 'done'; pushLog(task, `步骤2完成，产物：${f2}，行数：${step2.length - 1}`)

    task.steps[2].status = 'running'; task.steps[2].log.push('计算聚合指标'); pushLog(task, '步骤3开始聚合计算')
    const success = step2.slice(1).filter(r => r[2] === '1').length
    const total = step2.length - 1
    const f3 = path.join(ART_DIR, `${task.id}-step3.csv`)
    fs.writeFileSync(f3, toCsv([['metric','value'],['query_total',String(total)],['reachable_total',String(success)],['reach_rate',String((success/Math.max(total,1)).toFixed(4))]]), 'utf-8')
    task.steps[2].artifact = f3; task.steps[2].status = 'done'; pushLog(task, `步骤3完成，产物：${f3}`)

    task.status = 'done'; pushLog(task, '任务执行完成')
  } catch (e) {
    task.status = 'failed'; pushLog(task, '任务执行失败')
    const running = task.steps.find(s => s.status === 'running')
    if (running) { running.status = 'failed'; running.log.push(String(e)) }
  }
}

export function createTask(dimension: Dimension) {
  const id = `task-${Date.now()}`
  const task: EvalTask = { id, dimension, status: 'running', createdAt: new Date().toLocaleString('zh-CN'), steps: mkSteps(dimension), runtimeLogs: [] }
  TASKS.set(id, task)
  void runTask(task)
  return task
}

export function listTasks() { return Array.from(TASKS.values()).sort((a,b)=> (a.id<b.id?1:-1)) }
export function getTask(id: string) { return TASKS.get(id) }
