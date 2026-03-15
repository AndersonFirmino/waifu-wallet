import { type CSSProperties } from 'react'
import { getCurrencySymbol } from '../../utils/currency'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  style?: CSSProperties
  className?: string
  currency?: string
  locale?: string
}

function formatDisplayValue(value: number, locale: string): string {
  // Format without symbol for input display
  const parts = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(value)

  return parts.map((p) => p.value).join('')
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  style,
  className,
  currency = 'BRL',
  locale = 'pt-BR',
}: CurrencyInputProps) {
  const displayValue = value > 0 ? formatDisplayValue(value, locale) : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      onChange(0)
      return
    }
    const cents = parseInt(raw, 10)
    onChange(cents / 100)
  }

  const symbol = getCurrencySymbol(currency, locale)
  const defaultPlaceholder = `${symbol} 0${new Intl.NumberFormat(locale).format(0.0).includes(',') ? ',00' : '.00'}`

  return (
    <input
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder ?? defaultPlaceholder}
      style={style}
      className={className}
    />
  )
}
