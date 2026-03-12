import { describe, it, expect } from 'vitest'
import {
  formatMonth,
  formatMonthShort,
  formatDate,
  formatDateShort,
  getDaysInMonth,
  getFirstDayOfMonth,
  daysUntil,
} from '../date'

describe('formatMonth', () => {
  it('formats January correctly', () => {
    expect(formatMonth(2026, 0)).toBe('Janeiro de 2026')
  })

  it('formats March correctly', () => {
    expect(formatMonth(2026, 2)).toBe('Março de 2026')
  })

  it('formats December correctly', () => {
    expect(formatMonth(2025, 11)).toBe('Dezembro de 2025')
  })

  it('includes all month names correctly', () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ]
    months.forEach((name, i) => {
      expect(formatMonth(2026, i)).toBe(`${name} de 2026`)
    })
  })
})

describe('formatMonthShort', () => {
  it('formats January 2026 as Jan/26', () => {
    expect(formatMonthShort(2026, 0)).toBe('Jan/26')
  })

  it('formats March 2026 as Mar/26', () => {
    expect(formatMonthShort(2026, 2)).toBe('Mar/26')
  })

  it('formats December 2025 as Dez/25', () => {
    expect(formatMonthShort(2025, 11)).toBe('Dez/25')
  })

  it('slices year to last 2 digits', () => {
    expect(formatMonthShort(2030, 5)).toBe('Jun/30')
  })
})

describe('formatDate', () => {
  it('converts ISO date to dd/mm/yyyy', () => {
    expect(formatDate('2026-03-11')).toBe('11/03/2026')
  })

  it('converts date with leading zeros', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026')
  })

  it('preserves year correctly', () => {
    expect(formatDate('2025-12-31')).toBe('31/12/2025')
  })
})

describe('formatDateShort', () => {
  it('returns dd/mm only', () => {
    expect(formatDateShort('2026-03-11')).toBe('11/03')
  })

  it('works for beginning of year', () => {
    expect(formatDateShort('2026-01-01')).toBe('01/01')
  })

  it('works for end of year', () => {
    expect(formatDateShort('2026-12-31')).toBe('31/12')
  })
})

describe('getDaysInMonth', () => {
  it('January has 31 days', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31)
  })

  it('February 2026 has 28 days (non-leap year)', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28)
  })

  it('February 2024 has 29 days (leap year)', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29)
  })

  it('March has 31 days', () => {
    expect(getDaysInMonth(2026, 2)).toBe(31)
  })

  it('April has 30 days', () => {
    expect(getDaysInMonth(2026, 3)).toBe(30)
  })

  it('December has 31 days', () => {
    expect(getDaysInMonth(2026, 11)).toBe(31)
  })
})

describe('getFirstDayOfMonth', () => {
  // January 1, 2026 = Thursday = 4
  it('January 2026 starts on Thursday (4)', () => {
    expect(getFirstDayOfMonth(2026, 0)).toBe(4)
  })

  // February 1, 2026 = Sunday = 0
  it('February 2026 starts on Sunday (0)', () => {
    expect(getFirstDayOfMonth(2026, 1)).toBe(0)
  })

  // March 1, 2026 = Sunday = 0
  it('March 2026 starts on Sunday (0)', () => {
    expect(getFirstDayOfMonth(2026, 2)).toBe(0)
  })

  // April 1, 2026 = Wednesday = 3
  it('April 2026 starts on Wednesday (3)', () => {
    expect(getFirstDayOfMonth(2026, 3)).toBe(3)
  })
})

describe('daysUntil', () => {
  // Fake "today" hardcoded as March 11, 2026 in the source function.
  // Note: the function uses new Date(2026, 2, 11) (local time) vs
  // new Date(dateStr) (UTC). Results are ±1 in extreme UTC+ timezones.

  it('returns positive for a clearly future date', () => {
    expect(daysUntil('2026-06-11')).toBeGreaterThan(0)
  })

  it('returns negative for a clearly past date', () => {
    expect(daysUntil('2025-01-01')).toBeLessThan(0)
  })

  it('returns 15 for March 26 (UTC and UTC-3 both yield 15)', () => {
    expect(daysUntil('2026-03-26')).toBe(15)
  })

  it('returns 1 for March 12 (one day after fake today)', () => {
    expect(daysUntil('2026-03-12')).toBe(1)
  })

  it('returns 0 or 1 for the fake today itself (value is timezone-dependent for same-day UTC strings)', () => {
    // new Date(2026, 2, 11) uses local time; new Date('2026-03-11') uses UTC.
    // In UTC-3 (Brazil): diff = -3h → Math.ceil(-0.125) = 0
    // In UTC+N (N>0):   diff = +N h → Math.ceil(N/24) = 1
    const result = daysUntil('2026-03-11')
    expect(result === 0 || result === 1).toBe(true)
  })

  it('returns -1 for March 10 (day before fake today)', () => {
    expect(daysUntil('2026-03-10')).toBe(-1)
  })
})
