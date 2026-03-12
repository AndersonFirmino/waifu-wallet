import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  type TooltipProps,
} from 'recharts'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import { formatCurrency, formatCurrencyShort } from '../utils/currency'
import { type ForecastPoint, type ForecastPeriod } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const ALL_FORECAST: ForecastPoint[] = [
  { mes: 'Mar', otimista: 5806, base: 3842, pessimista: 1900 },
  { mes: 'Abr', otimista: 9512, base: 6084, pessimista: 2380 },
  { mes: 'Mai', otimista: 13218, base: 8226, pessimista: 2860 },
  { mes: 'Jun', otimista: 16924, base: 10368, pessimista: 3420 },
  { mes: 'Jul', otimista: 20630, base: 12510, pessimista: 3940 },
  { mes: 'Ago', otimista: 24336, base: 14652, pessimista: 4380 },
]

interface ForecastPeriodConfig {
  label: string
  months: number
}

const PERIODS: Record<ForecastPeriod, ForecastPeriodConfig> = {
  '1m': { label: '1 mês', months: 1 },
  '3m': { label: '3 meses', months: 3 },
  '6m': { label: '6 meses', months: 6 },
}

const FORECAST_PERIODS: ForecastPeriod[] = ['1m', '3m', '6m']

const CONSIDERATIONS = [
  { desc: 'Salário mensal (fixo)', valor: 6500, tipo: 'receita' as const, impacto: 'Alto' },
  { desc: 'Freelances estimados', valor: 500, tipo: 'receita' as const, impacto: 'Médio' },
  { desc: 'Gastos fixos mensais', valor: -2344, tipo: 'despesa' as const, impacto: 'Alto' },
  { desc: 'Variáveis estimadas', valor: -1200, tipo: 'despesa' as const, impacto: 'Médio' },
  { desc: 'Parcelas de dívidas', valor: -1150, tipo: 'despesa' as const, impacto: 'Alto' },
]

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

type ForecastTooltipProps = TooltipProps<number, string>

function ForecastTooltip({ active, payload, label }: ForecastTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 13,
      }}
    >
      <p style={{ color: 'var(--color-muted)', margin: '0 0 10px', fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '3px 0' }}>
          {p.name}: {formatCurrency(p.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Forecast() {
  const [period, setPeriod] = useState<ForecastPeriod>('6m')

  const periodConfig = PERIODS[period]
  const data = ALL_FORECAST.slice(0, periodConfig.months)

  const lastPoint = data[data.length - 1]
  const projected = lastPoint?.base ?? 0
  const optimistic = lastPoint?.otimista ?? 0
  const pessimistic = lastPoint?.pessimista ?? 0

  const totalEntradas = periodConfig.months * 7000
  const totalSaidas = periodConfig.months * 3842

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        🔮 Previsão de Saldo
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Projeção baseada em histórico e comprometimentos futuros
      </p>

      {/* Period Selector */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', width: 'fit-content' }}
      >
        {FORECAST_PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPeriod(p)
            }}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: period === p ? 'var(--color-blue)' : 'transparent',
              color: period === p ? '#fff' : 'var(--color-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {PERIODS[p].label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Saldo Projetado (base)" value={formatCurrency(projected)} color="blue" />
        <StatCard icon="🎯" label="Cenário Otimista" value={formatCurrency(optimistic)} color="green" />
        <StatCard icon="⚠️" label="Cenário Pessimista" value={formatCurrency(pessimistic)} color="red" />
        <StatCard
          icon="📊"
          label="Maior Risco"
          value="Dívidas"
          sub={`${formatCurrency(1150)}/mês em parcelas`}
          color="orange"
        />
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            Evolução do Saldo — {periodConfig.label}
          </h3>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>● Base</span>
            <span style={{ color: 'var(--color-green)' }}>● Otimista</span>
            <span style={{ color: 'var(--color-red)' }}>● Pessimista</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOtimista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPessimista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="mes"
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
            <Tooltip content={<ForecastTooltip />} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="otimista"
              name="Otimista"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradOtimista)"
              strokeDasharray="6 3"
            />
            <Area type="monotone" dataKey="base" name="Base" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradBase)" />
            <Area
              type="monotone"
              dataKey="pessimista"
              name="Pessimista"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradPessimista)"
              strokeDasharray="6 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Fatores Considerados
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONSIDERATIONS.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.tipo === 'receita' ? 'var(--color-green)' : 'var(--color-red)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {c.desc}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={c.impacto === 'Alto' ? 'red' : 'yellow'} size="xs">
                    {c.impacto}
                  </Badge>
                  <span
                    className="text-sm font-bold"
                    style={{ color: c.tipo === 'receita' ? 'var(--color-green)' : 'var(--color-red)' }}
                  >
                    {c.tipo === 'receita' ? '+' : ''}
                    {formatCurrency(c.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Resumo do Período ({periodConfig.label})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Total Entradas (est.)
              </span>
              <span className="font-bold" style={{ color: 'var(--color-green)' }}>
                +{formatCurrency(totalEntradas)}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Total Saídas (est.)
              </span>
              <span className="font-bold" style={{ color: 'var(--color-red)' }}>
                −{formatCurrency(totalSaidas)}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Saldo Projetado
              </span>
              <span className="font-bold text-lg" style={{ color: 'var(--color-blue)' }}>
                {formatCurrency(projected)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
