// ─── Shared ───────────────────────────────────────────────────────────────────

export type ColorVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray'
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg'
export type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'outline'

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: number
  type: TransactionType
  description: string
  category: string
  emoji: string
  amount: number
  date: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export interface CategoryData {
  name: string
  value: number
  color: string
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface MonthlyFinances {
  income: number
  expenses: number
  balance: number
}

export interface WealthSummary {
  total_debt: number
  total_loans: number
  total_card_bills: number
}

export interface CardOverview {
  id: number
  name: string
  used_pct: number
  bill: number
  due_day: number
  status: CardStatus
}

export interface FixedCostsOverview {
  confirmed_total: number
  estimated_total: number
}

export interface GachaOverview {
  active_banners: number
  total_cost: number
  next_due_date: string | null
}

export type AlertLevel = 'urgent' | 'warning' | 'info'

export interface Alert {
  level: AlertLevel
  message: string
}

export interface Summary {
  queried_at: string
  current_month: string
  monthly_finances: MonthlyFinances
  wealth: WealthSummary
  cards: CardOverview[]
  fixed_costs: FixedCostsOverview
  gacha: GachaOverview
  alerts: Alert[]
}

// ─── Fixed Expenses ───────────────────────────────────────────────────────────

export type FixedExpenseKind = 'fixed' | 'variable'

export interface FixedExpense {
  id: number
  name: string
  amount: number
  type: FixedExpenseKind
  confidence: number
  estimate: number
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export interface Debt {
  id: number
  name: string
  total: number
  remaining: number
  rate: number
  due_date: string
  installments: string
  urgent: boolean
}

export interface Loan {
  id: number
  name: string
  total: number
  remaining: number
  rate: number
  installment: number
  next_payment: string
  installments: string
}

// ─── Credit Cards ─────────────────────────────────────────────────────────────

export type CardStatus = 'open' | 'closed' | 'paid'
export type CardBrand = 'Mastercard' | 'Visa' | 'Elo' | 'Amex'

export interface CardBillHistory {
  id: number
  card_id: number
  month: string
  amount: number
  status: CardStatus
}

export interface CardBillItem {
  id: number
  card_id: number
  description: string
  amount: number
  date: string
}

export interface CreditCard {
  id: number
  name: string
  brand: CardBrand
  last_four: string
  limit: number
  used: number
  gradient_from: string
  gradient_to: string
  bill: number
  closing_day: number
  due_day: number
  status: CardStatus
  history: CardBillHistory[]
  items: CardBillItem[]
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarEventType = 'income' | 'expense' | 'installment'

export interface CalendarEvent {
  day: number
  type: CalendarEventType
  description: string
  amount: number
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastPoint {
  month: string
  optimistic: number
  base: number
  pessimistic: number
}

export type ForecastPeriod = '1m' | '3m' | '6m'

// ─── Gacha ────────────────────────────────────────────────────────────────────

export type GachaPriority = 1 | 2 | 3 | 4 | 5

export interface GachaBanner {
  id: number
  game: string
  banner: string
  cost: number
  start_date: string
  end_date: string
  priority: GachaPriority
  pulls: number
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: number
  date: string
  content: string
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
