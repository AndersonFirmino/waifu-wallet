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

export interface SavingsSummary {
  total_savings: number
  accounts: SavingsAccount[]
}

export interface Summary {
  queried_at: string
  current_month: string
  monthly_finances: MonthlyFinances
  wealth: WealthSummary
  cards: CardOverview[]
  fixed_costs: FixedCostsOverview
  gacha: GachaOverview
  savings: SavingsSummary
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

export type CardStatus = 'open' | 'closed' | 'paid' | 'pending' | 'blocked'
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
  subscriptions: CardSubscription[]
}

export type SubscriptionCurrency = 'BRL' | 'USD'

export interface CardSubscription {
  id: number
  card_id: number
  name: string
  amount: number
  currency: SubscriptionCurrency
  billing_day: number
  active: boolean
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type CalendarEventType = 'income' | 'expense' | 'installment' | 'holiday' | 'salary'

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

export interface GachaBannerImage {
  id: number
  banner_id: number
  url: string
  sort_order: number
}

export type CharTarget = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6'
export type WeaponTarget = 'S1' | 'S2' | 'S3' | 'S4' | 'S5'
export type WeaponCurrent = 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'

export interface GachaBanner {
  id: number
  game: string
  banner: string
  cost: number
  start_date: string
  end_date: string
  priority: GachaPriority
  pulls: number
  estimated_pulls: number
  char_target: CharTarget | null
  weapon_target: WeaponTarget | null
  char_current: CharTarget | null
  weapon_current: WeaponTarget | null
  image_url: string | null
  images: GachaBannerImage[]
}

export interface GachaStash {
  id: number
  stellar_jade: number
  special_passes: number
  double_gems_available: boolean
}

export interface GachaStashMulti {
  id: number
  game: string
  premium_currency: number
  passes: number
  weapon_passes: number
  double_gems_available: boolean
}

// ─── App Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  id: number
  manual_balance: number
}

// ─── Salary Plan ──────────────────────────────────────────────────────────────

export interface SalaryPlan {
  id: number
  employer: string
  current_salary: number
  target_salary: number
  increment: number
  increment_interval_months: number
  next_increment_date: string
  split_enabled: boolean
  split_start_date: string | null
  split_first_pct: number
  split_first_day: number
  split_second_pct: number
  split_second_day: number
  active: boolean
}

export interface SalarySchedulePayment {
  day: number
  amount: number
  label: string
}

export interface SalaryScheduleMonth {
  month: string
  salary: number
  payments: SalarySchedulePayment[]
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export interface SavingsAccount {
  id: number
  name: string
  bank: string
  balance: number
  goal: number
  emoji: string
  active: boolean
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
  refreshing: boolean
}

export interface PostState<TBody, TResponse> {
  post: (body: TBody) => Promise<TResponse>
  loading: boolean
  error: Error | null
}
