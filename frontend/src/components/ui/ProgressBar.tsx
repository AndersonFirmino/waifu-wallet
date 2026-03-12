import { type ColorVariant } from '../../types'

interface ProgressBarProps {
  value: number
  max?: number
  color?: ColorVariant | 'auto'
  label?: string
  showPercent?: boolean
  height?: number
}

const COLOR_MAP: Record<ColorVariant, string> = {
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
  red: 'var(--color-red)',
  yellow: 'var(--color-yellow)',
  purple: 'var(--color-purple)',
  orange: 'var(--color-orange)',
  gray: 'var(--color-muted)',
}

function resolveColor(color: ColorVariant | 'auto', pct: number): string {
  if (color === 'auto') {
    if (pct < 50) return 'var(--color-green)'
    if (pct < 80) return 'var(--color-yellow)'
    return 'var(--color-red)'
  }
  return COLOR_MAP[color]
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'blue',
  label,
  showPercent = true,
  height = 8,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const barColor = resolveColor(color, pct)

  return (
    <div className="w-full">
      {(label !== undefined || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label !== undefined && (
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span className="text-xs font-medium ml-auto" style={{ color: barColor }}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: `${String(height)}px`, backgroundColor: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${String(pct)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
