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

// Fake "today" = March 11, 2026
export function daysUntil(dateStr: string): number {
  const today = new Date(2026, 2, 11)
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
