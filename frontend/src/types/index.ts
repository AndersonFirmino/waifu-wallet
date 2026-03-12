// ─── Shared ───────────────────────────────────────────────────────────────────

export type ColorVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray'
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg'
export type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline'

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionType = 'receita' | 'despesa'

export interface Transaction {
  id: number
  tipo: TransactionType
  desc: string
  categoria: string
  emoji: string
  valor: number
  data: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface MonthlyData {
  mes: string
  receitas: number
  despesas: number
}

export interface CategoryData {
  name: string
  value: number
  color: string
}

// ─── Fixed Expenses ───────────────────────────────────────────────────────────

export type FixedExpenseKind = 'Fixo' | 'Variável'

export interface FixedExpense {
  id: number
  nome: string
  valor: number
  tipo: FixedExpenseKind
  confianca: number
  previsao: number
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export interface Debt {
  id: number
  nome: string
  total: number
  restante: number
  taxa: number
  vencimento: string
  parcelas: string
  urgente: boolean
}

export interface Loan {
  id: number
  nome: string
  total: number
  restante: number
  taxa: number
  parcela: number
  proximaParcela: string
  parcelas: string
}

// ─── Credit Cards ─────────────────────────────────────────────────────────────

export type CardStatus = 'aberta' | 'fechada' | 'paga'
export type CardBrand = 'Mastercard' | 'Visa' | 'Elo' | 'Amex'

export interface CardBillHistory {
  mes: string
  valor: number
  status: CardStatus
}

export interface CardBillItem {
  desc: string
  valor: number
  data: string
}

export interface CreditCard {
  id: number
  nome: string
  bandeira: CardBrand
  final: string
  limite: number
  usado: number
  gradientFrom: string
  gradientTo: string
  fatura: number
  fechamento: number
  vencimento: number
  status: CardStatus
  historico: CardBillHistory[]
  itens: CardBillItem[]
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarEventType = 'receita' | 'despesa' | 'parcela'

export interface CalendarEvent {
  dia: number
  tipo: CalendarEventType
  desc: string
  valor: number
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastPoint {
  mes: string
  otimista: number
  base: number
  pessimista: number
}

export type ForecastPeriod = '1m' | '3m' | '6m'

// ─── Gacha ────────────────────────────────────────────────────────────────────

export type GachaPriority = 1 | 2 | 3 | 4 | 5

export interface GachaBanner {
  id: number
  jogo: string
  banner: string
  custo: number
  inicio: string
  fim: string
  prioridade: GachaPriority
  puxadas: number
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: number
  data: string
  conteudo: string
}

// ─── API Hook ─────────────────────────────────────────────────────────────────

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export interface PostState<TBody, TResponse> {
  post: (body: TBody) => Promise<TResponse>
  loading: boolean
  error: Error | null
}
