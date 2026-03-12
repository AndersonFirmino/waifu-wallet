import { describe, it, expect } from 'vitest'
import { formatCurrency, formatCurrencyShort } from '../currency'

describe('formatCurrency', () => {
  it('contains R$ symbol', () => {
    expect(formatCurrency(1500)).toContain('R$')
  })

  it('formats integer thousands with dot separator (pt-BR)', () => {
    expect(formatCurrency(1500)).toContain('1.500')
  })

  it('formats cents with comma separator (pt-BR)', () => {
    expect(formatCurrency(55.9)).toContain('55,90')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })

  it('formats two decimal places', () => {
    expect(formatCurrency(1.5)).toContain('1,50')
  })

  it('formats large values', () => {
    expect(formatCurrency(100000)).toContain('100.000')
  })

  it('is consistent with Intl.NumberFormat pt-BR BRL', () => {
    const expected = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(6500)
    expect(formatCurrency(6500)).toBe(expected)
  })
})

describe('formatCurrencyShort', () => {
  it('abbreviates 1000 as R$ 1.0k', () => {
    expect(formatCurrencyShort(1000)).toBe('R$ 1.0k')
  })

  it('abbreviates 3842 as R$ 3.8k', () => {
    expect(formatCurrencyShort(3842)).toBe('R$ 3.8k')
  })

  it('abbreviates 10000 as R$ 10.0k', () => {
    expect(formatCurrencyShort(10000)).toBe('R$ 10.0k')
  })

  it('abbreviates 14652 as R$ 14.7k', () => {
    expect(formatCurrencyShort(14652)).toBe('R$ 14.7k')
  })

  it('falls back to formatCurrency for values under 1000', () => {
    expect(formatCurrencyShort(999)).toBe(formatCurrency(999))
  })

  it('falls back to formatCurrency for 0', () => {
    expect(formatCurrencyShort(0)).toBe(formatCurrency(0))
  })

  it('handles negative thousands', () => {
    expect(formatCurrencyShort(-2000)).toBe('R$ -2.0k')
  })

  it('treats -999 as under threshold and uses full format', () => {
    expect(formatCurrencyShort(-999)).toBe(formatCurrency(-999))
  })
})
