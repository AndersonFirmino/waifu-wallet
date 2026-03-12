import { useState } from 'react'
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
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency, formatCurrencyShort } from '../utils/currency'
import { formatMonth } from '../utils/date'
import { type MonthlyData, type CategoryData } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeSummary, decodeTransactionList } from '../lib/decode'

// ─── Static chart data (no aggregate endpoint) ────────────────────────────────

const ALL_MONTHLY: MonthlyData[] = [
  { month: 'Out', income: 6800, expenses: 4200 },
  { month: 'Nov', income: 7200, expenses: 4600 },
  { month: 'Dez', income: 9500, expenses: 7100 },
  { month: 'Jan', income: 7500, expenses: 4300 },
  { month: 'Fev', income: 7500, expenses: 3900 },
  { month: 'Mar', income: 7500, expenses: 3658 },
]

const CATEGORIES: CategoryData[] = [
  { name: 'Moradia', value: 1820, color: '#3b82f6' },
  { name: 'Alimentação', value: 650, color: '#10b981' },
  { name: 'Transporte', value: 180, color: '#f59e0b' },
  { name: 'Lazer', value: 320, color: '#8b5cf6' },
  { name: 'Saúde', value: 280, color: '#f97316' },
  { name: 'Contas', value: 408, color: '#64748b' },
]

const PAYDAY_DAY = 5

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
  const catEntry = CATEGORIES.find((c) => c.name === item.name)
  const color = catEntry?.color ?? 'var(--color-text)'
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const { data: summary } = useFetch('/summary/', decodeSummary)
  const txUrl = `/transactions/?month=${String(month + 1)}&year=${String(year)}`
  const { data: transactions } = useFetch(txUrl, decodeTransactionList)

  const income = summary?.monthly_finances.income ?? 0
  const expenses = summary?.monthly_finances.expenses ?? 0
  const balance = summary?.monthly_finances.balance ?? 0

  const todayDay = today.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const nextPaydayDays = daysInMonth - todayDay + PAYDAY_DAY
  const paydayPct = Math.round((todayDay / daysInMonth) * 100)

  const recentTransactions = (transactions ?? []).slice(0, 5)

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

  const nextPaydayDate = new Date(year, month + 1, PAYDAY_DAY)
  const nextPaydayLabel = nextPaydayDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
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
          sub="receitas − despesas"
          color="blue"
        />
        <StatCard
          icon="📈"
          label="Receitas"
          value={formatCurrency(income)}
          sub="mês atual"
          color="green"
        />
        <StatCard
          icon="📉"
          label="Despesas"
          value={formatCurrency(expenses)}
          sub="mês atual"
          color="red"
        />
        <StatCard
          icon="⏳"
          label="Próximo Salário"
          value={`${String(nextPaydayDays)} dias`}
          sub={`dia ${String(PAYDAY_DAY)} — ${nextPaydayLabel}`}
          color="purple"
        />
      </div>

      {/* Payday Bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🗓️</span>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              Progresso do Mês
            </span>
          </div>
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Dia {todayDay} de {daysInMonth} — salário no dia {PAYDAY_DAY}
          </span>
        </div>
        <ProgressBar value={todayDay} max={daysInMonth} color="blue" height={10} showPercent />
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {paydayPct}% do mês passou
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-blue)' }}>
            Próximo: {nextPaydayLabel} ({nextPaydayDays} dias)
          </span>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <Card>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Receitas vs Despesas — 6 meses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ALL_MONTHLY} barCategoryGap="30%">
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
                  data={CATEGORIES}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {CATEGORIES.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {CATEGORIES.map((cat) => (
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
  )
}
