from __future__ import annotations

from pydantic import BaseModel, ConfigDict

# ─── Transaction ──────────────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    type: str
    description: str
    category: str
    emoji: str
    amount: float
    date: str


class TransactionOut(TransactionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Fixed Expense ────────────────────────────────────────────────────────────

class FixedExpenseCreate(BaseModel):
    name: str
    amount: float
    type: str
    confidence: int
    estimate: float


class FixedExpenseOut(FixedExpenseCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Debt ─────────────────────────────────────────────────────────────────────

class DebtCreate(BaseModel):
    name: str
    total: float
    remaining: float
    rate: float
    due_date: str
    installments: str
    urgent: bool


class DebtOut(DebtCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Loan ─────────────────────────────────────────────────────────────────────

class LoanCreate(BaseModel):
    name: str
    total: float
    remaining: float
    rate: float
    installment: float
    next_payment: str
    installments: str


class LoanOut(LoanCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Credit Card ──────────────────────────────────────────────────────────────

class CardBillHistoryCreate(BaseModel):
    month: str
    amount: float
    status: str


class CardBillHistoryOut(CardBillHistoryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    card_id: int


class CardBillItemCreate(BaseModel):
    description: str
    amount: float
    date: str


class CardBillItemOut(CardBillItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    card_id: int


class CreditCardCreate(BaseModel):
    name: str
    brand: str
    last_four: str
    limit: float
    used: float
    gradient_from: str
    gradient_to: str
    bill: float
    closing_day: int
    due_day: int
    status: str


class CreditCardOut(CreditCardCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    history: list[CardBillHistoryOut]
    items: list[CardBillItemOut]


# ─── Note ─────────────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    date: str
    content: str


class NoteUpdate(BaseModel):
    content: str


class NoteOut(NoteCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─── Gacha ────────────────────────────────────────────────────────────────────

class GachaBannerCreate(BaseModel):
    game: str
    banner: str
    cost: float
    start_date: str
    end_date: str
    priority: int
    pulls: int = 0


class GachaBannerOut(GachaBannerCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PullsUpdate(BaseModel):
    pulls: int


# ─── Savings Account ──────────────────────────────────────────────────────────

class SavingsAccountCreate(BaseModel):
    name: str
    bank: str
    balance: float
    goal: float
    emoji: str
    active: bool


class SavingsAccountOut(SavingsAccountCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BalanceUpdate(BaseModel):
    balance: float


# ─── Salary Plan ──────────────────────────────────────────────────────────────

class SalaryPlanCreate(BaseModel):
    employer: str
    current_salary: float
    target_salary: float
    increment: float
    increment_interval_months: int
    next_increment_date: str
    split_enabled: bool
    split_first_pct: int
    split_first_day: int
    split_second_pct: int
    split_second_day: int
    active: bool


class SalaryPlanOut(SalaryPlanCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SalarySchedulePayment(BaseModel):
    day: int
    amount: float
    label: str


class SalaryScheduleMonth(BaseModel):
    month: str          # YYYY-MM
    salary: float
    payments: list[SalarySchedulePayment]


# ─── Calendar ─────────────────────────────────────────────────────────────────

class CalendarEventOut(BaseModel):
    day: int
    type: str           # income | expense | installment
    description: str
    amount: float


# ─── Forecast ─────────────────────────────────────────────────────────────────

class ForecastPointOut(BaseModel):
    month: str
    optimistic: float
    base: float
    pessimistic: float


# ─── Summary ──────────────────────────────────────────────────────────────────

class MonthlyFinancesOut(BaseModel):
    income: float
    expenses: float
    balance: float


class WealthSummaryOut(BaseModel):
    total_debt: float
    total_loans: float
    total_card_bills: float


class CardOverviewOut(BaseModel):
    id: int
    name: str
    used_pct: float
    bill: float
    due_day: int
    status: str


class FixedCostsOverviewOut(BaseModel):
    confirmed_total: float
    estimated_total: float


class GachaOverviewOut(BaseModel):
    active_banners: int
    total_cost: float
    next_due_date: str | None


class AlertOut(BaseModel):
    level: str          # urgent | warning | info
    message: str


class SavingsSummaryOut(BaseModel):
    total_savings: float
    accounts: list[SavingsAccountOut]


class SummaryOut(BaseModel):
    queried_at: str
    current_month: str
    monthly_finances: MonthlyFinancesOut
    wealth: WealthSummaryOut
    cards: list[CardOverviewOut]
    fixed_costs: FixedCostsOverviewOut
    gacha: GachaOverviewOut
    savings: SavingsSummaryOut
    alerts: list[AlertOut]
