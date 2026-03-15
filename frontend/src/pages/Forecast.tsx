import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { formatCurrency, formatCurrencyShort } from '../utils/currency'
import { type ForecastPoint, type ForecastPeriod } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeForecastList, decodeSummary, decodeDebtList, decodeLoanList } from '../lib/decode'
import { useLocale } from '../hooks/useLocale'

interface ForecastPeriodConfig {
  labelKey: string
  months: number
}

const PERIODS: Record<ForecastPeriod, ForecastPeriodConfig> = {
  '1m': { labelKey: 'forecast.period_1m', months: 1 },
  '3m': { labelKey: 'forecast.period_3m', months: 3 },
  '6m': { labelKey: 'forecast.period_6m', months: 6 },
}

const FORECAST_PERIODS: ForecastPeriod[] = ['1m', '3m', '6m']

interface ConsiderationItem {
  description: string
  amount: number
  type: 'income' | 'expense'
  impact: string
  impactLevel: 'high' | 'medium'
}


// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface ForecastTooltipInnerProps {
  active?: boolean
  payload?: TooltipProps<number, string>['payload']
  label?: string
  currency: string
  locale: string
}

function ForecastTooltip({ active, payload, label, currency, locale }: ForecastTooltipInnerProps) {
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
          {p.name}: {formatCurrency(p.value ?? 0, currency, locale)}
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Forecast() {
  const { t } = useTranslation()
  const { language, currency } = useLocale()

  const [period, setPeriod] = useState<ForecastPeriod>('6m')

  const { data: forecastData, loading: forecastLoading } = useFetch(`/forecast/?period=${period}`, decodeForecastList)
  const { data: summary } = useFetch('/summary/', decodeSummary)
  const { data: debts } = useFetch('/debts', decodeDebtList)
  const { data: loans } = useFetch('/loans', decodeLoanList)
  const data: ForecastPoint[] = forecastData ?? []

  const monthlyLoanPayments = (loans ?? []).reduce((sum, l) => sum + l.installment, 0)
  const monthlyDebtPayments = (debts ?? []).reduce((sum, d) => {
    const [paidStr, totalStr] = d.installments.split('/')
    const left = Number(totalStr) - Number(paidStr)
    return sum + (left > 0 ? d.remaining / left : 0)
  }, 0)
  const totalInstallments = monthlyDebtPayments + monthlyLoanPayments

  const confirmedFixed = summary?.fixed_costs.confirmed_total ?? 0
  const variableEstimate = (summary?.fixed_costs.estimated_total ?? 0) - confirmedFixed
  const monthlyIncome = summary?.monthly_finances.income ?? 0

  const considerations: ConsiderationItem[] = []
  if (monthlyIncome > 0) {
    considerations.push({ description: t('forecast.consideration_income'), amount: monthlyIncome, type: 'income', impact: t('forecast.impact_high'), impactLevel: 'high' })
  }
  if (confirmedFixed > 0) {
    considerations.push({ description: t('forecast.consideration_fixed'), amount: -confirmedFixed, type: 'expense', impact: t('forecast.impact_high'), impactLevel: 'high' })
  }
  if (variableEstimate > 0) {
    considerations.push({ description: t('forecast.consideration_variable'), amount: -variableEstimate, type: 'expense', impact: t('forecast.impact_medium'), impactLevel: 'medium' })
  }
  if (totalInstallments > 0) {
    considerations.push({ description: t('forecast.consideration_installments'), amount: -totalInstallments, type: 'expense', impact: t('forecast.impact_high'), impactLevel: 'high' })
  }

  const riskCategories = [
    { label: t('forecast.risk_installments'), monthly: totalInstallments },
    { label: t('forecast.risk_fixed'), monthly: confirmedFixed },
    { label: t('forecast.risk_variable'), monthly: variableEstimate },
  ]
  const sortedRisks = [...riskCategories].sort((a, b) => b.monthly - a.monthly)
  const topRisk = sortedRisks[0] ?? { label: '\u2014', monthly: 0 }

  const periodLabel = t(PERIODS[period].labelKey)
  const lastPoint = data[data.length - 1]
  const projected = lastPoint?.base ?? 0
  const optimistic = lastPoint?.optimistic ?? 0
  const pessimistic = lastPoint?.pessimistic ?? 0

  const totalBase = data.reduce((s, p) => s + p.base, 0)
  const totalOptimistic = data.reduce((s, p) => s + p.optimistic, 0)
  const totalPessimistic = data.reduce((s, p) => s + p.pessimistic, 0)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        🔮 {t('forecast.title')}
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        {t('forecast.subtitle')}
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
            className="px-5 py-2 rounded-lg text-sm transition-all"
            style={{
              background: period === p ? 'var(--color-blue)' : 'transparent',
              color: period === p ? '#fff' : 'var(--color-muted)',
              fontWeight: period === p ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t(PERIODS[p].labelKey)}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label={t('forecast.projected_balance')} value={formatCurrency(projected, currency, language)} numericValue={projected} numericFormatter={(v: number) => formatCurrency(v, currency, language)} color="blue" />
        <StatCard icon="🎯" label={t('forecast.optimistic')} value={formatCurrency(optimistic, currency, language)} numericValue={optimistic} numericFormatter={(v: number) => formatCurrency(v, currency, language)} color="green" />
        <StatCard icon="⚠️" label={t('forecast.pessimistic')} value={formatCurrency(pessimistic, currency, language)} numericValue={pessimistic} numericFormatter={(v: number) => formatCurrency(v, currency, language)} color="red" />
        <StatCard
          icon="📊"
          label={t('forecast.top_risk')}
          value={topRisk.monthly > 0 ? topRisk.label : '\u2014'}
          sub={topRisk.monthly > 0 ? t('forecast.per_month', { value: formatCurrency(topRisk.monthly, currency, language) }) : t('forecast.no_data_risk')}
          color="orange"
        />
      </div>

      {/* Loading state */}
      {forecastLoading && (
        <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
          {t('common.loading')}
        </p>
      )}

      {/* Empty state */}
      {!forecastLoading && forecastData !== null && forecastData.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
          {t('forecast.empty_state')}
        </p>
      )}

      {/* Chart */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            {t('forecast.chart_title', { period: periodLabel })}
          </h3>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>● {t('forecast.base')}</span>
            <span style={{ color: 'var(--color-green)' }}>● {t('forecast.optimistic')}</span>
            <span style={{ color: 'var(--color-red)' }}>● {t('forecast.pessimistic')}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPessimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
              tickFormatter={(v: number) => formatCurrencyShort(v, currency, language)}
            />
            <Tooltip content={<ForecastTooltip currency={currency} locale={language} />} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="optimistic"
              name={t('forecast.optimistic')}
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradOptimistic)"
              strokeDasharray="6 3"
            />
            <Area
              type="monotone"
              dataKey="base"
              name={t('forecast.base')}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradBase)"
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              name={t('forecast.pessimistic')}
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradPessimistic)"
              strokeDasharray="6 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            {t('forecast.factors')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {considerations.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.type === 'income' ? 'var(--color-green)' : 'var(--color-red)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {c.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={c.impactLevel === 'high' ? 'red' : 'yellow'} size="xs">
                    {c.impact}
                  </Badge>
                  <span
                    className="text-sm font-bold"
                    style={{ color: c.type === 'income' ? 'var(--color-green)' : 'var(--color-red)' }}
                  >
                    {c.type === 'income' ? '+' : ''}
                    {formatCurrency(c.amount, currency, language)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            {t('forecast.period_summary')} ({periodLabel})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('forecast.accumulated_optimistic')}
              </span>
              <span className="font-bold" style={{ color: 'var(--color-green)' }}>
                +<AnimatedNumber value={totalOptimistic} formatter={(v: number) => formatCurrency(v, currency, language)} />
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('forecast.accumulated_pessimistic')}
              </span>
              <span className="font-bold" style={{ color: 'var(--color-red)' }}>
                <AnimatedNumber value={totalPessimistic} formatter={(v: number) => formatCurrency(v, currency, language)} />
              </span>
            </div>
            <div
              className="flex justify-between items-center p-3 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {t('forecast.accumulated_base')}
              </span>
              <span className="font-bold text-lg" style={{ color: 'var(--color-blue)' }}>
                <AnimatedNumber value={totalBase} formatter={(v: number) => formatCurrency(v, currency, language)} />
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
