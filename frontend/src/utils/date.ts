export function formatMonth(year: number, month: number, locale = 'pt-BR'): string {
  const date = new Date(year, month, 1)
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date)
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  if (locale.startsWith('pt')) {
    return `${capitalized} de ${String(year)}`
  }
  return `${capitalized} ${String(year)}`
}

export function formatMonthShort(year: number, month: number, locale = 'pt-BR'): string {
  const date = new Date(year, month, 1)
  const monthShort = new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
  const cleaned = monthShort.replace('.', '')
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return `${capitalized}/${String(year).slice(2)}`
}

export function formatDate(dateStr: string, locale = 'pt-BR'): string {
  const parts = dateStr.split('-')
  const year = parts[0] ?? ''
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''

  if (locale.startsWith('pt')) {
    return `${day}/${month}/${year}`
  }
  return `${month}/${day}/${year}`
}

export function formatDateShort(dateStr: string, locale = 'pt-BR'): string {
  const parts = dateStr.split('-')
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''

  if (locale.startsWith('pt')) {
    return `${day}/${month}`
  }
  return `${month}/${day}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function daysUntil(dateStr: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDateRange(startStr: string, endStr: string, locale = 'pt-BR'): string {
  const startParts = startStr.split('-')
  const endParts = endStr.split('-')

  const startMonthIdx = parseInt(startParts[1] ?? '1', 10) - 1
  const endMonthIdx = parseInt(endParts[1] ?? '1', 10) - 1

  const startDate = new Date(2000, startMonthIdx, 1)
  const endDate = new Date(2000, endMonthIdx, 1)

  const startMonth = new Intl.DateTimeFormat(locale, { month: 'short' }).format(startDate).replace('.', '').toLowerCase()
  const endMonth = new Intl.DateTimeFormat(locale, { month: 'short' }).format(endDate).replace('.', '').toLowerCase()

  const startDay = startParts[2] ?? ''
  const endDay = endParts[2] ?? ''

  return `${startDay}/${startMonth} → ${endDay}/${endMonth}`
}
