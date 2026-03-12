import { type ReactNode } from 'react'
import { type ColorVariant, type SizeVariant } from '../../types'

interface BadgeProps {
  children: ReactNode
  color?: ColorVariant
  pulse?: boolean
  size?: SizeVariant
}

interface BadgeColors {
  bg: string
  text: string
  border: string
}

const COLOR_MAP: Record<ColorVariant, BadgeColors> = {
  blue: { bg: 'rgba(59,130,246,0.15)', text: 'var(--color-blue)', border: 'rgba(59,130,246,0.3)' },
  green: { bg: 'rgba(16,185,129,0.15)', text: 'var(--color-green)', border: 'rgba(16,185,129,0.3)' },
  red: { bg: 'rgba(239,68,68,0.15)', text: 'var(--color-red)', border: 'rgba(239,68,68,0.3)' },
  yellow: { bg: 'rgba(245,158,11,0.15)', text: 'var(--color-yellow)', border: 'rgba(245,158,11,0.3)' },
  purple: { bg: 'rgba(139,92,246,0.15)', text: 'var(--color-purple)', border: 'rgba(139,92,246,0.3)' },
  orange: { bg: 'rgba(249,115,22,0.15)', text: 'var(--color-orange)', border: 'rgba(249,115,22,0.3)' },
  gray: { bg: 'rgba(100,116,139,0.15)', text: 'var(--color-muted)', border: 'rgba(100,116,139,0.3)' },
}

const SIZE_MAP: Record<SizeVariant, string> = {
  xs: 'text-xs px-1.5 py-0.5',
  sm: 'text-xs px-2.5 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-sm px-4 py-2',
}

export default function Badge({ children, color = 'blue', pulse = false, size = 'sm' }: BadgeProps) {
  const c = COLOR_MAP[color]

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${SIZE_MAP[size]} ${pulse ? 'animate-pulse-glow' : ''}`}
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
    >
      {children}
    </span>
  )
}
