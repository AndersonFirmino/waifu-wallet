import { useState, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  type TooltipProps,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import TimelineRoadmap, { type TimelineEvent } from '../components/TimelineRoadmap'
import { formatCurrency, formatCurrencyShort } from '../utils/currency'
import { formatMonth } from '../utils/date'
import { type MonthlyData, type CategoryData, type SalaryPlan, type GachaBanner } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeSummary, decodeTransactionList, decodeNoteList, decodeSalaryPlanList, decodeGachaBannerList } from '../lib/decode'

const MONTH_LABELS: readonly string[] = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

const CATEGORY_COLORS: readonly string[] = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#f97316', '#64748b', '#ec4899', '#14b8a6',
]

// ─── Payday helpers ───────────────────────────────────────────────────────────

interface NextPayday {
  date: Date
  daysUntil: number
  amount: number
  label: string
}

function isSplitActiveForDate(plan: SalaryPlan, d: Date): boolean {
  if (!plan.split_enabled) return false
  if (plan.split_start_date === null) return true
  // Compare year-month only
  const splitParts = plan.split_start_date.split('-')
  const splitYear = parseInt(splitParts[0] ?? '0', 10)
  const splitMonth = parseInt(splitParts[1] ?? '1', 10) - 1 // 0-indexed
  const dYear = d.getFullYear()
  const dMonth = d.getMonth()
  return dYear > splitYear || (dYear === splitYear && dMonth >= splitMonth)
}

function computeNextPayday(plan: SalaryPlan, today: Date): NextPayday {
  const todayDay = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const splitActive = isSplitActiveForDate(plan, today)

  if (splitActive) {
    const firstDay = plan.split_first_day
    const secondDay = plan.split_second_day
    const firstAmount = Math.round(plan.current_salary * (plan.split_first_pct / 100) * 100) / 100
    const secondAmount = Math.round(plan.current_salary * (plan.split_second_pct / 100) * 100) / 100

    let targetDate: Date
    let amount: number

    if (todayDay < firstDay) {
      targetDate = new Date(todayYear, todayMonth, firstDay)
      amount = firstAmount
    } else if (todayDay < secondDay) {
      targetDate = new Date(todayYear, todayMonth, secondDay)
      amount = secondAmount
    } else {
      targetDate = new Date(todayYear, todayMonth + 1, firstDay)
      amount = firstAmount
    }

    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntil = Math.round((targetDate.getTime() - new Date(todayYear, todayMonth, todayDay).getTime()) / msPerDay)

    return {
      date: targetDate,
      daysUntil,
      amount,
      label: targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
    }
  }

  // Non-split: single payday on split_first_day
  const payday = plan.split_first_day
  const fullAmount = plan.current_salary

  let targetDate: Date
  if (todayDay < payday) {
    targetDate = new Date(todayYear, todayMonth, payday)
  } else {
    targetDate = new Date(todayYear, todayMonth + 1, payday)
  }

  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntil = Math.round((targetDate.getTime() - new Date(todayYear, todayMonth, todayDay).getTime()) / msPerDay)

  return {
    date: targetDate,
    daysUntil,
    amount: fullAmount,
    label: targetDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
  }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface BarPayloadItem {
  value: number
  name: string
  color: string
}

interface BarTooltipProps {
  active?: boolean
  payload?: BarPayloadItem[]
  label?: string
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
      }}
    >
      <p style={{ color: 'var(--color-muted)', margin: '0 0 8px', fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

type PieTooltipProps = TooltipProps<number, string>

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
  const color = typeof item.color === 'string' ? item.color : 'var(--color-text)'
  return (
    <div
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
      }}
    >
      <p style={{ color, margin: 0, fontWeight: 600 }}>
        {item.name}: {formatCurrency(item.value ?? 0)}
      </p>
    </div>
  )
}

// ─── Timeline builder ─────────────────────────────────────────────────────────

function buildTimelineEvents(
  activePlan: SalaryPlan | null,
  gachaBanners: GachaBanner[] | null,
): TimelineEvent[] {
  const now = new Date()
  const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  const collected: TimelineEvent[] = [{ date: now, label: 'Hoje', type: 'today' }]

  if (activePlan) {
    const salaryEvents: TimelineEvent[] = []

    for (let offset = 0; offset <= 3; offset++) {
      const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const checkYear = ref.getFullYear()
      const checkMonth = ref.getMonth()
      const checkDate = new Date(checkYear, checkMonth, 1)
      const splitActive = isSplitActiveForDate(activePlan, checkDate)

      if (splitActive) {
        const firstDay = activePlan.split_first_day
        const secondDay = activePlan.split_second_day
        const firstAmount = Math.round(activePlan.current_salary * (activePlan.split_first_pct / 100) * 100) / 100
        const secondAmount = Math.round(activePlan.current_salary * (activePlan.split_second_pct / 100) * 100) / 100
        const d1 = new Date(checkYear, checkMonth, firstDay)
        const d2 = new Date(checkYear, checkMonth, secondDay)

        if (d1.getTime() > todayMs && d1 <= threeMonthsLater) {
          salaryEvents.push({ date: d1, label: 'Salário', sublabel: formatCurrency(firstAmount), type: 'salary' })
        }
        if (d2.getTime() > todayMs && d2 <= threeMonthsLater) {
          salaryEvents.push({ date: d2, label: 'Salário', sublabel: formatCurrency(secondAmount), type: 'salary' })
        }
      } else {
        const payday = activePlan.split_first_day
        const d = new Date(checkYear, checkMonth, payday)
        if (d.getTime() > todayMs && d <= threeMonthsLater) {
          salaryEvents.push({ date: d, label: 'Salário', sublabel: formatCurrency(activePlan.current_salary), type: 'salary' })
        }
      }
    }

    const seen = new Set<number>()
    for (const ev of salaryEvents) {
      const key = ev.date.getTime()
      if (!seen.has(key)) {
        seen.add(key)
        collected.push(ev)
      }
    }
  }

  if (gachaBanners) {
    for (const banner of gachaBanners) {
      const startDate = new Date(banner.start_date + 'T00:00:00')
      if (startDate <= threeMonthsLater) {
        const truncatedLabel = banner.banner.length > 20 ? banner.banner.slice(0, 18) + '\u2026' : banner.banner
        const bannerImage = banner.images[0]?.url ?? banner.image_url ?? undefined
        collected.push({
          date: startDate,
          label: truncatedLabel,
          sublabel: formatCurrency(banner.cost),
          type: 'gacha',
          imageUrl: bannerImage,
        })
      }
    }
  }

  return [...collected].sort((a, b) => a.date.getTime() - b.date.getTime())
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const { data: summary } = useFetch('/summary/', decodeSummary)
  const txUrl = `/transactions/?month=${String(month + 1)}&year=${String(year)}`
  const { data: transactions } = useFetch(txUrl, decodeTransactionList)
  const { data: allTransactions } = useFetch('/transactions/', decodeTransactionList)
  const { data: allNotes } = useFetch('/notes/', decodeNoteList)
  const { data: salaryPlans } = useFetch('/salary-plans/', decodeSalaryPlanList)
  const { data: gachaBanners } = useFetch('/gacha/banners/', decodeGachaBannerList)

  const income = summary?.monthly_finances.income ?? 0
  const expenses = summary?.monthly_finances.expenses ?? 0
  const balance = summary?.monthly_finances.balance ?? 0

  const activePlan = salaryPlans?.find((p) => p.active) ?? null

  const nextPayday: NextPayday | null = activePlan ? computeNextPayday(activePlan, today) : null

  const recentTransactions = (transactions ?? []).slice(0, 5)
  const recentNotes = [...(allNotes ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 3)

  const monthlyData: MonthlyData[] = useMemo(() => {
    if (!allTransactions) return []
    const result: MonthlyData[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const prefix = `${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}`
      const monthTxs = allTransactions.filter((tx) => tx.date.startsWith(prefix))
      result.push({
        month: MONTH_LABELS[m] ?? '',
        income: monthTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
        expenses: monthTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
      })
    }
    return result
  }, [allTransactions, month, year])

  const categories: CategoryData[] = useMemo(() => {
    if (!transactions) return []
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount)
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? '#64748b',
      }))
  }, [transactions])

  const timelineEvents: TimelineEvent[] = buildTimelineEvents(activePlan, gachaBanners)

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, padding: '28px 32px' }}>
    {/* Main content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Visão geral das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span
            className="font-semibold text-base px-2"
            style={{ color: 'var(--color-text)', minWidth: 180, textAlign: 'center' }}
          >
            {formatMonth(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="💰"
          label="Saldo do Mês"
          value={formatCurrency(balance)}
          numericValue={balance}
          numericFormatter={formatCurrency}
          sub="receitas − despesas"
          color="blue"
        />
        <StatCard
          icon="📈"
          label="Receitas"
          value={formatCurrency(income)}
          numericValue={income}
          numericFormatter={formatCurrency}
          sub="mês atual"
          color="green"
        />
        <StatCard
          icon="📉"
          label="Despesas"
          value={formatCurrency(expenses)}
          numericValue={expenses}
          numericFormatter={formatCurrency}
          sub="mês atual"
          color="red"
        />
        <StatCard
          icon="⏳"
          label="Próximo Salário"
          value={nextPayday ? `${String(nextPayday.daysUntil)} dias` : '—'}
          numericValue={nextPayday ? nextPayday.daysUntil : undefined}
          numericFormatter={(n: number) => `${String(Math.round(n))} dias`}
          sub={nextPayday ? `${formatCurrency(nextPayday.amount)} — ${nextPayday.label}` : 'sem plano ativo'}
          color="purple"
        />
      </div>

      {/* Timeline Roadmap */}
      <TimelineRoadmap events={timelineEvents} />

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Receitas vs Despesas — 6 meses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barCategoryGap="30%">
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--color-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => formatCurrencyShort(v)}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-muted)' }} />
              <Bar dataKey="income" name="Receitas" fill="url(#gradIncome)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="url(#gradExpenses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Despesas por Categoria
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categories.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {formatCurrencyShort(cat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            Últimas Transações
          </h3>
          <a
            href="/transactions"
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--color-blue)' }}
          >
            Ver todas →
          </a>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            Nenhuma transação neste mês
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-3 py-3 rounded-lg"
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{
                      backgroundColor: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {tx.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)', margin: 0 }}>
                      {tx.description}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                      {tx.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: tx.type === 'income' ? 'var(--color-green)' : 'var(--color-red)',
                      margin: 0,
                    }}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                    {tx.date.slice(8)}/{tx.date.slice(5, 7)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>

    {/* Right sidebar — Advisor Notes */}
    <div style={{ width: 360, flexShrink: 0, position: 'sticky', top: 28, alignSelf: 'flex-start', marginTop: 89 }}>
      <Card style={{ maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            📋 Notas do Conselheiro
          </h3>
          <a
            href="/notes"
            className="text-xs font-medium hover:underline"
            style={{ color: 'var(--color-blue)' }}
          >
            Ver todas →
          </a>
        </div>
        {recentNotes.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--color-muted)' }}>
            Nenhuma nota registrada
          </p>
        ) : (
          <div style={{ overflow: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentNotes.map((note) => {
                const parts = note.date.split('-')
                const day = parts[2] ?? ''
                const noteMonth = parts[1] ?? ''
                const noteYear = parts[0] ?? ''

                return (
                  <div key={note.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: 'var(--color-blue)',
                          border: '1px solid rgba(59,130,246,0.2)',
                        }}
                      >
                        {day}/{noteMonth}/{noteYear}
                      </div>
                    </div>
                    <div
                      className="text-sm leading-relaxed prose-notes"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <Markdown remarkPlugins={[remarkGfm]}>{note.content}</Markdown>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
    </div>
  )
}
