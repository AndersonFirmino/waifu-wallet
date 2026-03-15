import type {
  Transaction,
  TransactionType,
  FixedExpense,
  FixedExpenseKind,
  Debt,
  Loan,
  CreditCard,
  CardBillHistory,
  CardBillItem,
  CardBrand,
  CardStatus,
  CardSubscription,
  SubscriptionCurrency,
  Note,
  GachaBanner,
  GachaBannerImage,
  GachaPriority,
  GachaStash,
  GachaStashMulti,
  CharTarget,
  WeaponTarget,
  CalendarEvent,
  CalendarEventType,
  ForecastPoint,
  Summary,
  MonthlyFinances,
  WealthSummary,
  CardOverview,
  FixedCostsOverview,
  GachaOverview,
  Alert,
  AlertLevel,
  SalaryPlan,
  SalarySchedulePayment,
  SalaryScheduleMonth,
  SavingsAccount,
  SavingsSummary,
  AppSettings,
} from '../types'

// ─── Primitive validators ─────────────────────────────────────────────────────

function assertRecord(val: unknown): asserts val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new Error('Expected plain object')
  }
}

function num(val: unknown, field: string): number {
  if (typeof val !== 'number') throw new Error(`${field}: expected number, got ${typeof val}`)
  return val
}

function str(val: unknown, field: string): string {
  if (typeof val !== 'string') throw new Error(`${field}: expected string, got ${typeof val}`)
  return val
}

function bool(val: unknown, field: string): boolean {
  if (typeof val !== 'boolean') throw new Error(`${field}: expected boolean, got ${typeof val}`)
  return val
}

function arr(val: unknown, field: string): unknown[] {
  if (!Array.isArray(val)) throw new Error(`${field}: expected array, got ${typeof val}`)
  return val
}

function nullableStr(val: unknown, field: string): string | null {
  if (val === null) return null
  return str(val, field)
}

// ─── Union validators ─────────────────────────────────────────────────────────

function asTransactionType(val: unknown): TransactionType {
  if (val === 'income' || val === 'expense') return val
  throw new Error(`Invalid TransactionType: ${String(val)}`)
}

function asFixedExpenseKind(val: unknown): FixedExpenseKind {
  if (val === 'fixed' || val === 'variable') return val
  throw new Error(`Invalid FixedExpenseKind: ${String(val)}`)
}

function asCardStatus(val: unknown): CardStatus {
  if (val === 'open' || val === 'closed' || val === 'paid' || val === 'pending' || val === 'blocked') return val
  throw new Error(`Invalid CardStatus: ${String(val)}`)
}

function asCardBrand(val: unknown): CardBrand {
  if (val === 'Mastercard' || val === 'Visa' || val === 'Elo' || val === 'Amex') return val
  throw new Error(`Invalid CardBrand: ${String(val)}`)
}

function asSubscriptionCurrency(val: unknown): SubscriptionCurrency {
  if (val === 'BRL' || val === 'USD') return val
  throw new Error(`Invalid SubscriptionCurrency: ${String(val)}`)
}

function asCalendarEventType(val: unknown): CalendarEventType {
  if (val === 'income' || val === 'expense' || val === 'installment' || val === 'holiday' || val === 'salary') return val
  throw new Error(`Invalid CalendarEventType: ${String(val)}`)
}

function asAlertLevel(val: unknown): AlertLevel {
  if (val === 'urgent' || val === 'warning' || val === 'info') return val
  throw new Error(`Invalid AlertLevel: ${String(val)}`)
}

function asGachaPriority(val: unknown): GachaPriority {
  if (val === 1 || val === 2 || val === 3 || val === 4 || val === 5) return val
  throw new Error(`Invalid GachaPriority: ${String(val)}`)
}

function asCharTarget(val: unknown): CharTarget | null {
  if (val === null || val === undefined) return null
  if (val === 'E0' || val === 'E1' || val === 'E2' || val === 'E3' || val === 'E4' || val === 'E5' || val === 'E6') return val
  throw new Error(`Invalid CharTarget: ${typeof val === 'string' ? val : typeof val}`)
}

function asWeaponTarget(val: unknown): WeaponTarget | null {
  if (val === null || val === undefined) return null
  if (val === 'S1' || val === 'S2' || val === 'S3' || val === 'S4' || val === 'S5') return val
  throw new Error(`Invalid WeaponTarget: ${typeof val === 'string' ? val : typeof val}`)
}

// ─── Decoders ─────────────────────────────────────────────────────────────────

export function decodeTransaction(raw: unknown): Transaction {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    type: asTransactionType(raw.type),
    description: str(raw.description, 'description'),
    category: str(raw.category, 'category'),
    emoji: str(raw.emoji, 'emoji'),
    amount: num(raw.amount, 'amount'),
    date: str(raw.date, 'date'),
  }
}

export function decodeTransactionList(raw: unknown): Transaction[] {
  return arr(raw, 'transactions').map(decodeTransaction)
}

export function decodeFixedExpense(raw: unknown): FixedExpense {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    amount: num(raw.amount, 'amount'),
    type: asFixedExpenseKind(raw.type),
    confidence: num(raw.confidence, 'confidence'),
    estimate: num(raw.estimate, 'estimate'),
  }
}

export function decodeFixedExpenseList(raw: unknown): FixedExpense[] {
  return arr(raw, 'fixed_expenses').map(decodeFixedExpense)
}

export function decodeDebt(raw: unknown): Debt {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    total: num(raw.total, 'total'),
    remaining: num(raw.remaining, 'remaining'),
    rate: num(raw.rate, 'rate'),
    due_date: str(raw.due_date, 'due_date'),
    installments: str(raw.installments, 'installments'),
    urgent: bool(raw.urgent, 'urgent'),
  }
}

export function decodeDebtList(raw: unknown): Debt[] {
  return arr(raw, 'debts').map(decodeDebt)
}

export function decodeLoan(raw: unknown): Loan {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    total: num(raw.total, 'total'),
    remaining: num(raw.remaining, 'remaining'),
    rate: num(raw.rate, 'rate'),
    installment: num(raw.installment, 'installment'),
    next_payment: str(raw.next_payment, 'next_payment'),
    installments: str(raw.installments, 'installments'),
  }
}

export function decodeLoanList(raw: unknown): Loan[] {
  return arr(raw, 'loans').map(decodeLoan)
}

function decodeCardBillHistory(raw: unknown): CardBillHistory {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    card_id: num(raw.card_id, 'card_id'),
    month: str(raw.month, 'month'),
    amount: num(raw.amount, 'amount'),
    status: asCardStatus(raw.status),
  }
}

function decodeCardBillItem(raw: unknown): CardBillItem {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    card_id: num(raw.card_id, 'card_id'),
    description: str(raw.description, 'description'),
    amount: num(raw.amount, 'amount'),
    date: str(raw.date, 'date'),
  }
}

function decodeCardSubscription(raw: unknown): CardSubscription {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    card_id: num(raw.card_id, 'card_id'),
    name: str(raw.name, 'name'),
    amount: num(raw.amount, 'amount'),
    currency: asSubscriptionCurrency(raw.currency),
    billing_day: num(raw.billing_day, 'billing_day'),
    active: bool(raw.active, 'active'),
  }
}

export function decodeCreditCard(raw: unknown): CreditCard {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    brand: asCardBrand(raw.brand),
    last_four: str(raw.last_four, 'last_four'),
    limit: num(raw.limit, 'limit'),
    used: num(raw.used, 'used'),
    gradient_from: str(raw.gradient_from, 'gradient_from'),
    gradient_to: str(raw.gradient_to, 'gradient_to'),
    bill: num(raw.bill, 'bill'),
    closing_day: num(raw.closing_day, 'closing_day'),
    due_day: num(raw.due_day, 'due_day'),
    status: asCardStatus(raw.status),
    history: arr(raw.history, 'history').map(decodeCardBillHistory),
    items: arr(raw.items, 'items').map(decodeCardBillItem),
    subscriptions: arr(raw.subscriptions, 'subscriptions').map(decodeCardSubscription),
  }
}

export function decodeCreditCardList(raw: unknown): CreditCard[] {
  return arr(raw, 'credit_cards').map(decodeCreditCard)
}

export function decodeNote(raw: unknown): Note {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    date: str(raw.date, 'date'),
    content: str(raw.content, 'content'),
  }
}

export function decodeNoteList(raw: unknown): Note[] {
  return arr(raw, 'notes').map(decodeNote)
}

function decodeGachaBannerImage(raw: unknown): GachaBannerImage {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    banner_id: num(raw.banner_id, 'banner_id'),
    url: str(raw.url, 'url'),
    sort_order: num(raw.sort_order, 'sort_order'),
  }
}

export function decodeGachaBanner(raw: unknown): GachaBanner {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    game: str(raw.game, 'game'),
    banner: str(raw.banner, 'banner'),
    cost: num(raw.cost, 'cost'),
    start_date: str(raw.start_date, 'start_date'),
    end_date: str(raw.end_date, 'end_date'),
    priority: asGachaPriority(raw.priority),
    pulls: num(raw.pulls, 'pulls'),
    estimated_pulls: num(raw.estimated_pulls, 'estimated_pulls'),
    char_target: asCharTarget(raw.char_target),
    weapon_target: asWeaponTarget(raw.weapon_target),
    char_current: asCharTarget(raw.char_current),
    weapon_current: asWeaponTarget(raw.weapon_current),
    image_url: nullableStr(raw.image_url, 'image_url'),
    images: Array.isArray(raw.images) ? arr(raw.images, 'images').map(decodeGachaBannerImage) : [],
  }
}

export function decodeGachaStash(raw: unknown): GachaStash {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    stellar_jade: num(raw.stellar_jade, 'stellar_jade'),
    special_passes: num(raw.special_passes, 'special_passes'),
    double_gems_available: bool(raw.double_gems_available, 'double_gems_available'),
  }
}

export function decodeBannerList(raw: unknown): GachaBanner[] {
  return arr(raw, 'banners').map(decodeGachaBanner)
}

export function decodeGachaBannerList(raw: unknown): GachaBanner[] {
  return arr(raw, 'banners').map(decodeGachaBanner)
}

// ─── Multi-game Stash ────────────────────────────────────────────────────────

export function decodeGachaStashMulti(raw: unknown): GachaStashMulti {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    game: str(raw.game, 'game'),
    premium_currency: num(raw.premium_currency, 'premium_currency'),
    passes: num(raw.passes, 'passes'),
    weapon_passes: num(raw.weapon_passes, 'weapon_passes'),
    double_gems_available: bool(raw.double_gems_available, 'double_gems_available'),
  }
}

export function decodeGachaStashMultiList(raw: unknown): GachaStashMulti[] {
  return arr(raw, 'stashes').map(decodeGachaStashMulti)
}

// ─── App Settings ────────────────────────────────────────────────────────────

export function decodeAppSettings(raw: unknown): AppSettings {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    manual_balance: num(raw.manual_balance, 'manual_balance'),
    language: str(raw.language, 'language'),
    currency: str(raw.currency, 'currency'),
  }
}

export function decodeCalendarEvent(raw: unknown): CalendarEvent {
  assertRecord(raw)
  return {
    day: num(raw.day, 'day'),
    type: asCalendarEventType(raw.type),
    description: str(raw.description, 'description'),
    amount: num(raw.amount, 'amount'),
  }
}

export function decodeCalendarEventList(raw: unknown): CalendarEvent[] {
  return arr(raw, 'calendar_events').map(decodeCalendarEvent)
}

export function decodeForecastPoint(raw: unknown): ForecastPoint {
  assertRecord(raw)
  return {
    month: str(raw.month, 'month'),
    optimistic: num(raw.optimistic, 'optimistic'),
    base: num(raw.base, 'base'),
    pessimistic: num(raw.pessimistic, 'pessimistic'),
  }
}

export function decodeForecastList(raw: unknown): ForecastPoint[] {
  return arr(raw, 'forecast').map(decodeForecastPoint)
}

function decodeMonthlyFinances(raw: unknown): MonthlyFinances {
  assertRecord(raw)
  return {
    income: num(raw.income, 'income'),
    expenses: num(raw.expenses, 'expenses'),
    balance: num(raw.balance, 'balance'),
  }
}

function decodeWealthSummary(raw: unknown): WealthSummary {
  assertRecord(raw)
  return {
    total_debt: num(raw.total_debt, 'total_debt'),
    total_loans: num(raw.total_loans, 'total_loans'),
    total_card_bills: num(raw.total_card_bills, 'total_card_bills'),
  }
}

function decodeCardOverview(raw: unknown): CardOverview {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    used_pct: num(raw.used_pct, 'used_pct'),
    bill: num(raw.bill, 'bill'),
    due_day: num(raw.due_day, 'due_day'),
    status: asCardStatus(raw.status),
  }
}

function decodeFixedCostsOverview(raw: unknown): FixedCostsOverview {
  assertRecord(raw)
  return {
    confirmed_total: num(raw.confirmed_total, 'confirmed_total'),
    estimated_total: num(raw.estimated_total, 'estimated_total'),
  }
}

function decodeGachaOverview(raw: unknown): GachaOverview {
  assertRecord(raw)
  return {
    active_banners: num(raw.active_banners, 'active_banners'),
    total_cost: num(raw.total_cost, 'total_cost'),
    next_due_date: nullableStr(raw.next_due_date, 'next_due_date'),
  }
}

function decodeAlert(raw: unknown): Alert {
  assertRecord(raw)
  return {
    level: asAlertLevel(raw.level),
    message: str(raw.message, 'message'),
  }
}

// ─── Salary Plan ──────────────────────────────────────────────────────────────

export function decodeSalaryPlan(raw: unknown): SalaryPlan {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    employer: str(raw.employer, 'employer'),
    current_salary: num(raw.current_salary, 'current_salary'),
    target_salary: num(raw.target_salary, 'target_salary'),
    increment: num(raw.increment, 'increment'),
    increment_interval_months: num(raw.increment_interval_months, 'increment_interval_months'),
    next_increment_date: str(raw.next_increment_date, 'next_increment_date'),
    split_enabled: bool(raw.split_enabled, 'split_enabled'),
    split_start_date: nullableStr(raw.split_start_date, 'split_start_date'),
    split_first_pct: num(raw.split_first_pct, 'split_first_pct'),
    split_first_day: num(raw.split_first_day, 'split_first_day'),
    split_second_pct: num(raw.split_second_pct, 'split_second_pct'),
    split_second_day: num(raw.split_second_day, 'split_second_day'),
    active: bool(raw.active, 'active'),
  }
}

export function decodeSalaryPlanList(raw: unknown): SalaryPlan[] {
  return arr(raw, 'salary_plans').map(decodeSalaryPlan)
}

export function decodeSalarySchedulePayment(raw: unknown): SalarySchedulePayment {
  assertRecord(raw)
  return {
    day: num(raw.day, 'day'),
    amount: num(raw.amount, 'amount'),
    label: str(raw.label, 'label'),
  }
}

export function decodeSalaryScheduleMonth(raw: unknown): SalaryScheduleMonth {
  assertRecord(raw)
  return {
    month: str(raw.month, 'month'),
    salary: num(raw.salary, 'salary'),
    payments: arr(raw.payments, 'payments').map(decodeSalarySchedulePayment),
  }
}

export function decodeSalaryScheduleList(raw: unknown): SalaryScheduleMonth[] {
  return arr(raw, 'schedule').map(decodeSalaryScheduleMonth)
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export function decodeSavingsAccount(raw: unknown): SavingsAccount {
  assertRecord(raw)
  return {
    id: num(raw.id, 'id'),
    name: str(raw.name, 'name'),
    bank: str(raw.bank, 'bank'),
    balance: num(raw.balance, 'balance'),
    goal: num(raw.goal, 'goal'),
    emoji: str(raw.emoji, 'emoji'),
    active: bool(raw.active, 'active'),
  }
}

export function decodeSavingsAccountList(raw: unknown): SavingsAccount[] {
  return arr(raw, 'savings_accounts').map(decodeSavingsAccount)
}

function decodeSavingsSummary(raw: unknown): SavingsSummary {
  assertRecord(raw)
  return {
    total_savings: num(raw.total_savings, 'total_savings'),
    accounts: arr(raw.accounts, 'accounts').map(decodeSavingsAccount),
  }
}

export function decodeSummary(raw: unknown): Summary {
  assertRecord(raw)
  return {
    queried_at: str(raw.queried_at, 'queried_at'),
    current_month: str(raw.current_month, 'current_month'),
    monthly_finances: decodeMonthlyFinances(raw.monthly_finances),
    wealth: decodeWealthSummary(raw.wealth),
    cards: arr(raw.cards, 'cards').map(decodeCardOverview),
    fixed_costs: decodeFixedCostsOverview(raw.fixed_costs),
    gacha: decodeGachaOverview(raw.gacha),
    savings: decodeSavingsSummary(raw.savings),
    alerts: arr(raw.alerts, 'alerts').map(decodeAlert),
  }
}
