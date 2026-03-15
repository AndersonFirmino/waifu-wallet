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

function getCurrencyFractionDigits(currency: string): number {
  const parts = new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).formatToParts(1)
  const fractionPart = parts.find((p) => p.type === 'fraction')
  return fractionPart ? fractionPart.value.length : 0
}

function formatDisplayValue(value: number, locale: string, fractionDigits: number): string {
  // Format without symbol for input display
  const parts = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
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
  const fractionDigits = getCurrencyFractionDigits(currency)
  const divisor = 10 ** fractionDigits
  const displayValue = value > 0 ? formatDisplayValue(value, locale, fractionDigits) : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw === '') {
      onChange(0)
      return
    }
    const cents = parseInt(raw, 10)
    onChange(cents / divisor)
  }

  const symbol = getCurrencySymbol(currency, locale)
  const decimalSeparator =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.'
  const placeholderZeros = fractionDigits > 0 ? `${decimalSeparator}${'0'.repeat(fractionDigits)}` : ''
  const defaultPlaceholder = `${symbol} 0${placeholderZeros}`

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
