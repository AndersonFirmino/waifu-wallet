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
import { type MonthlyData, type CategoryData, type Transaction } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const ALL_MONTHLY: MonthlyData[] = [
  { mes: 'Out', receitas: 6800, despesas: 4200 },
  { mes: 'Nov', receitas: 7200, despesas: 4600 },
  { mes: 'Dez', receitas: 9500, despesas: 7100 },
  { mes: 'Jan', receitas: 7500, despesas: 4300 },
  { mes: 'Fev', receitas: 7500, despesas: 3900 },
  { mes: 'Mar', receitas: 7500, despesas: 3658 },
]

const CATEGORIAS: CategoryData[] = [
  { name: 'Moradia', value: 1820, color: '#3b82f6' },
  { name: 'Alimentação', value: 650, color: '#10b981' },
  { name: 'Transporte', value: 180, color: '#f59e0b' },
  { name: 'Lazer', value: 320, color: '#8b5cf6' },
  { name: 'Saúde', value: 280, color: '#f97316' },
  { name: 'Contas', value: 408, color: '#64748b' },
]

const ULTIMAS: Transaction[] = [
  { id: 1, tipo: 'receita', desc: 'Salário', categoria: 'Trabalho', emoji: '💼', valor: 6500, data: '2026-03-05' },
  { id: 2, tipo: 'despesa', desc: 'Aluguel', categoria: 'Moradia', emoji: '🏠', valor: 1500, data: '2026-03-05' },
  { id: 3, tipo: 'despesa', desc: 'Supermercado', categoria: 'Alimentação', emoji: '🛒', valor: 280, data: '2026-03-08' },
  { id: 4, tipo: 'despesa', desc: 'Farmácia', categoria: 'Saúde', emoji: '💊', valor: 85, data: '2026-03-09' },
  { id: 5, tipo: 'receita', desc: 'Freelance', categoria: 'Renda Extra', emoji: '💻', valor: 1000, data: '2026-03-11' },
]

const PAYDAY_DAY = 5
const TODAY_DAY = 11
const DAYS_IN_MARCH = 31
const NEXT_PAYDAY_DAYS = DAYS_IN_MARCH - TODAY_DAY + PAYDAY_DAY // ~25 days until April 5

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

interface PieTooltipProps extends TooltipProps<number, string> {}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  if (!item) return null
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
      <p style={{ color: item.payload.color, margin: 0, fontWeight: 600 }}>
        {item.name}: {formatCurrency(item.value ?? 0)}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [month, setMonth] = useState(2)
  const [year, setYear] = useState(2026)

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

  const receitas = 7500
  const despesas = 3658
  const saldo = receitas - despesas
  const paydayPct = Math.round((TODAY_DAY / DAYS_IN_MARCH) * 100)

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
          <span className="font-semibold text-base px-2" style={{ color: 'var(--color-text)', minWidth: 180, textAlign: 'center' }}>
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
        <StatCard icon="💰" label="Saldo do Mês" value={formatCurrency(saldo)} sub="receitas − despesas" color="blue" trend={12} />
        <StatCard icon="📈" label="Receitas" value={formatCurrency(receitas)} sub="2 fontes de renda" color="green" trend={0} />
        <StatCard icon="📉" label="Despesas" value={formatCurrency(despesas)} sub="11 transações" color="red" trend={-6} />
        <StatCard icon="⏳" label="Próximo Salário" value={`${NEXT_PAYDAY_DAYS} dias`} sub="dia 5 de Abril" color="purple" />
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
            Dia {TODAY_DAY} de {DAYS_IN_MARCH} — salário no dia {PAYDAY_DAY}
          </span>
        </div>
        <ProgressBar value={TODAY_DAY} max={DAYS_IN_MARCH} color="blue" height={10} showPercent />
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {paydayPct}% do mês passou
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-blue)' }}>
            Próximo: 5/Abr ({NEXT_PAYDAY_DAYS} dias)
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
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrencyShort(v)} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-muted)' }} />
              <Bar dataKey="receitas" name="Receitas" fill="url(#gradReceitas)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="url(#gradDespesas)" radius={[4, 4, 0, 0]} />
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
                  data={CATEGORIAS}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {CATEGORIAS.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {CATEGORIAS.map((cat) => (
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

      {/* Last Transactions */}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ULTIMAS.map((tx) => (
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
                    backgroundColor:
                      tx.tipo === 'receita' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {tx.emoji}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)', margin: 0 }}>
                    {tx.desc}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                    {tx.categoria}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: tx.tipo === 'receita' ? 'var(--color-green)' : 'var(--color-red)',
                    margin: 0,
                  }}
                >
                  {tx.tipo === 'receita' ? '+' : '-'}
                  {formatCurrency(tx.valor)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                  {tx.data.slice(8)}/{tx.data.slice(5, 7)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
