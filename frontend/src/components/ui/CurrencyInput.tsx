import { type CSSProperties } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  style?: CSSProperties
  className?: string
}

function formatBRL(value: number): string {
  const [intPart, decPart = '00'] = value.toFixed(2).split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedInt},${decPart}`
}

export default function CurrencyInput({ value, onChange, placeholder, style, className }: CurrencyInputProps) {
  const displayValue = value > 0 ? formatBRL(value) : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      onChange(0)
      return
    }
    const cents = parseInt(raw, 10)
    onChange(cents / 100)
  }

  return (
    <input
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder ?? 'R$ 0,00'}
      style={style}
      className={className}
    />
  )
}
