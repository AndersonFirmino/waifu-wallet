import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatMonth,
  formatMonthShort,
  formatDate,
  formatDateShort,
  getDaysInMonth,
  getFirstDayOfMonth,
  daysUntil,
  formatDateRange,
} from '../date'

describe('formatMonth', () => {
  it('formats pt-BR month with "de" connector', () => {
    const result = formatMonth(2026, 0) // January
    expect(result).toContain('2026')
    expect(result).toContain('de')
  })

  it('formats en-US month without "de"', () => {
    const result = formatMonth(2026, 0, 'en-US')
    expect(result).toBe('January 2026')
  })

  it('formats March correctly for pt-BR', () => {
    const result = formatMonth(2026, 2)
    expect(result).toContain('2026')
  })
})

describe('formatMonthShort', () => {
  it('formats short month with year for pt-BR', () => {
    const result = formatMonthShort(2026, 0)
    expect(result).toContain('/26')
  })

  it('formats short month with year for en-US', () => {
    const result = formatMonthShort(2026, 0, 'en-US')
    expect(result).toContain('Jan')
    expect(result).toContain('/26')
  })
})

describe('formatDate', () => {
  it('formats DD/MM/YYYY for pt-BR', () => {
    expect(formatDate('2026-03-15')).toBe('15/03/2026')
  })

  it('formats MM/DD/YYYY for en-US', () => {
    expect(formatDate('2026-03-15', 'en-US')).toBe('03/15/2026')
  })
})

describe('formatDateShort', () => {
  it('formats DD/MM for pt-BR', () => {
    expect(formatDateShort('2026-03-15')).toBe('15/03')
  })

  it('formats MM/DD for en-US', () => {
    expect(formatDateShort('2026-03-15', 'en-US')).toBe('03/15')
  })
})

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31)
  })

  it('returns 28 for February 2026', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28)
  })

  it('returns 29 for February 2024 (leap year)', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29)
  })

  it('returns 31 for March', () => {
    expect(getDaysInMonth(2026, 2)).toBe(31)
  })

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 3)).toBe(30)
  })

  it('returns 31 for December', () => {
    expect(getDaysInMonth(2026, 11)).toBe(31)
  })
})

describe('getFirstDayOfMonth', () => {
  it('returns a number 0-6', () => {
    const result = getFirstDayOfMonth(2026, 0)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(6)
  })

  it('January 2026 starts on Thursday (4)', () => {
    expect(getFirstDayOfMonth(2026, 0)).toBe(4)
  })

  it('February 2026 starts on Sunday (0)', () => {
    expect(getFirstDayOfMonth(2026, 1)).toBe(0)
  })
})

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a number', () => {
    const result = daysUntil('2030-01-01')
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThan(0)
  })

  it('returns positive for a future date', () => {
    expect(daysUntil('2026-06-12')).toBeGreaterThan(0)
  })

  it('returns negative for a past date', () => {
    expect(daysUntil('2025-01-01')).toBeLessThan(0)
  })

  it('returns 14 for March 26 from March 12', () => {
    expect(daysUntil('2026-03-26')).toBe(14)
  })

  it('returns -1 for yesterday', () => {
    expect(daysUntil('2026-03-11')).toBe(-1)
  })
})

describe('formatDateRange', () => {
  it('formats range with short months', () => {
    const result = formatDateRange('2026-01-15', '2026-02-10')
    expect(result).toContain('15/')
    expect(result).toContain('→')
    expect(result).toContain('10/')
  })

  it('formats a date range with PT-BR month abbreviations', () => {
    const result = formatDateRange('2026-04-21', '2026-05-13')
    expect(result).toContain('21/')
    expect(result).toContain('→')
    expect(result).toContain('13/')
  })

  it('handles same-month range', () => {
    const result = formatDateRange('2026-03-01', '2026-03-15')
    expect(result).toContain('01/')
    expect(result).toContain('→')
    expect(result).toContain('15/')
  })
})
