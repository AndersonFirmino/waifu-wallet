import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyShort, getCurrencySymbol } from '../currency'

describe('formatCurrency', () => {
  it('formats BRL with pt-BR locale by default', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('R$')
    expect(result).toContain('1.500')
  })

  it('formats USD with en-US locale', () => {
    const result = formatCurrency(1500, 'USD', 'en-US')
    expect(result).toContain('$')
    expect(result).toContain('1,500')
  })

  it('formats EUR with de-DE locale', () => {
    const result = formatCurrency(1500, 'EUR', 'de-DE')
    expect(result).toContain('€')
  })

  it('formats JPY (zero decimal currency)', () => {
    const result = formatCurrency(1500, 'JPY', 'ja-JP')
    expect(result).toContain('￥')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })

  it('is consistent with Intl.NumberFormat', () => {
    const expected = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(6500)
    expect(formatCurrency(6500)).toBe(expected)
  })
})

describe('getCurrencySymbol', () => {
  it('returns R$ for BRL', () => {
    expect(getCurrencySymbol('BRL', 'pt-BR')).toBe('R$')
  })

  it('returns $ for USD', () => {
    const symbol = getCurrencySymbol('USD', 'en-US')
    expect(symbol).toBe('$')
  })

  it('returns € for EUR', () => {
    const symbol = getCurrencySymbol('EUR', 'en-US')
    expect(symbol).toBe('€')
  })
})

describe('formatCurrencyShort', () => {
  it('abbreviates BRL 1000 with symbol', () => {
    const result = formatCurrencyShort(1000)
    expect(result).toContain('R$')
    expect(result).toContain('1.0k')
  })

  it('abbreviates USD 3842 with symbol', () => {
    const result = formatCurrencyShort(3842, 'USD', 'en-US')
    expect(result).toContain('$')
    expect(result).toContain('3.8k')
  })

  it('falls back to formatCurrency for values under 1000', () => {
    expect(formatCurrencyShort(999)).toBe(formatCurrency(999))
  })

  it('falls back to formatCurrency for 0', () => {
    expect(formatCurrencyShort(0)).toBe(formatCurrency(0))
  })

  it('handles negative thousands', () => {
    const result = formatCurrencyShort(-2000)
    expect(result).toContain('R$')
    expect(result).toContain('-2.0k')
  })

  it('treats -999 as under threshold', () => {
    expect(formatCurrencyShort(-999)).toBe(formatCurrency(-999))
  })
})
