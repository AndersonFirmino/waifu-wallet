import { type ReactNode } from 'react'
import { type ColorVariant } from '../../types'
import Card from './Card'
import AnimatedNumber from './AnimatedNumber'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  numericValue?: number
  numericFormatter?: (n: number) => string
  sub?: string
  color?: ColorVariant
  trend?: number
}

const COLOR_MAP: Record<ColorVariant, { accent: string; bg: string }> = {
  blue: { accent: 'var(--color-blue)', bg: 'rgba(59,130,246,0.1)' },
  green: { accent: 'var(--color-green)', bg: 'rgba(16,185,129,0.1)' },
  red: { accent: 'var(--color-red)', bg: 'rgba(239,68,68,0.1)' },
  purple: { accent: 'var(--color-purple)', bg: 'rgba(139,92,246,0.1)' },
  yellow: { accent: 'var(--color-yellow)', bg: 'rgba(245,158,11,0.1)' },
  orange: { accent: 'var(--color-orange)', bg: 'rgba(249,115,22,0.1)' },
  gray: { accent: 'var(--color-muted)', bg: 'rgba(100,116,139,0.1)' },
}

export default function StatCard({ icon, label, value, numericValue, numericFormatter, sub, color = 'blue', trend }: StatCardProps) {
  const c = COLOR_MAP[color]

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: c.bg }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              color: trend >= 0 ? 'var(--color-green)' : 'var(--color-red)',
              backgroundColor: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            }}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: c.accent }}>
        {numericValue !== undefined && numericFormatter
          ? <AnimatedNumber value={numericValue} formatter={numericFormatter} />
          : value}
      </p>
      {sub !== undefined && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          {sub}
        </p>
      )}
    </Card>
  )
}
