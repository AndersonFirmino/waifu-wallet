export function formatCurrency(value: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

export function getCurrencySymbol(currency = 'BRL', locale = 'pt-BR'): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(0)
  return formatted.replace(/[\d.,\s]/g, '').trim()
}

export function formatCurrencyShort(value: number, currency = 'BRL', locale = 'pt-BR'): string {
  if (Math.abs(value) >= 1000) {
    const symbol = getCurrencySymbol(currency, locale)
    return `${symbol} ${(value / 1000).toFixed(1)}k`
  }
  return formatCurrency(value, currency, locale)
}
