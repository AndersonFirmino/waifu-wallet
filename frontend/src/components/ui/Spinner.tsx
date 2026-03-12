interface SpinnerProps {
  size?: number
  color?: string
}

export default function Spinner({ size = 24, color = 'var(--color-blue)' }: SpinnerProps) {
  return (
    <div
      className="animate-spin-ring rounded-full border-2"
      style={{
        width: size,
        height: size,
        borderColor: 'var(--color-border)',
        borderTopColor: color,
      }}
    />
  )
}
