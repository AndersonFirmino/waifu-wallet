const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export function formatMonth(year: number, month: number): string {
  return `${MONTHS[month] ?? ''} de ${String(year)}`
}

export function formatMonthShort(year: number, month: number): string {
  return `${MONTHS_SHORT[month] ?? ''}/${String(year).slice(2)}`
}

export function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const year = parts[0] ?? ''
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''
  return `${day}/${month}/${year}`
}

export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-')
  const month = parts[1] ?? ''
  const day = parts[2] ?? ''
  return `${day}/${month}`
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

const MONTHS_SHORT_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const

export function formatDateRange(startStr: string, endStr: string): string {
  const startParts = startStr.split('-')
  const endParts = endStr.split('-')
  const startMonth = MONTHS_SHORT_PT[parseInt(startParts[1] ?? '1', 10) - 1] ?? ''
  const endMonth = MONTHS_SHORT_PT[parseInt(endParts[1] ?? '1', 10) - 1] ?? ''
  const startDay = startParts[2] ?? ''
  const endDay = endParts[2] ?? ''
  return `${startDay}/${startMonth} → ${endDay}/${endMonth}`
}
