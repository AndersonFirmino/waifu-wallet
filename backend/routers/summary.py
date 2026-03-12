from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import CreditCard, Debt, FixedExpense, GachaBanner, Loan, Transaction
from schemas import (
    AlertOut,
    CardOverviewOut,
    FixedCostsOverviewOut,
    GachaOverviewOut,
    MonthlyFinancesOut,
    SummaryOut,
    WealthSummaryOut,
)

router = APIRouter(prefix="/summary", tags=["summary"])

_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


@router.get("/", response_model=SummaryOut)
def get_summary(db: Session = Depends(get_db)) -> SummaryOut:
    today = date.today()
    month_prefix = f"{today.year:04d}-{today.month:02d}-"

    # ── Monthly finances ──────────────────────────────────────────────────────
    current_txs = list(db.scalars(
        select(Transaction).where(Transaction.date.like(f"{month_prefix}%"))
    ).all())
    income = sum(t.amount for t in current_txs if t.type == "income")
    expenses = sum(t.amount for t in current_txs if t.type == "expense")

    # ── Wealth snapshot ───────────────────────────────────────────────────────
    debts = list(db.scalars(select(Debt)).all())
    loans = list(db.scalars(select(Loan)).all())
    cards = list(db.scalars(select(CreditCard)).all())

    # ── Card overviews ────────────────────────────────────────────────────────
    card_overviews = [
        CardOverviewOut(
            id=c.id,
            name=c.name,
            used_pct=round(c.used / c.limit * 100, 1) if c.limit > 0 else 0.0,
            bill=c.bill,
            due_day=c.due_day,
            status=c.status,
        )
        for c in cards
    ]

    # ── Fixed costs ───────────────────────────────────────────────────────────
    fixed = list(db.scalars(select(FixedExpense)).all())
    confirmed = sum(e.amount for e in fixed if e.confidence >= 90)
    estimated = sum(e.estimate for e in fixed)

    # ── Gacha ─────────────────────────────────────────────────────────────────
    banners = list(db.scalars(select(GachaBanner)).all())
    active = [b for b in banners if b.end_date >= today.isoformat()]
    next_due = min((b.end_date for b in active), default=None)

    # ── Alerts ────────────────────────────────────────────────────────────────
    alerts: list[AlertOut] = []

    for d in debts:
        if d.urgent:
            alerts.append(AlertOut(level="urgent", message=f"Divida urgente: {d.name}"))
        days_left = (date.fromisoformat(d.due_date) - today).days
        if 0 <= days_left <= 7:
            alerts.append(AlertOut(level="warning", message=f"{d.name} vence em {days_left} dias"))

    for c in cards:
        pct = c.used / c.limit * 100 if c.limit > 0 else 0.0
        if pct >= 90:
            alerts.append(AlertOut(level="urgent", message=f"Cartao {c.name} com {pct:.0f}% do limite"))
        elif pct >= 75:
            alerts.append(AlertOut(level="warning", message=f"Cartao {c.name} com {pct:.0f}% do limite"))

    if income - expenses < 0:
        alerts.append(AlertOut(level="warning", message="Saldo negativo no mes atual"))

    return SummaryOut(
        queried_at=today.isoformat(),
        current_month=f"{_MONTH_NAMES[today.month - 1]} {today.year}",
        monthly_finances=MonthlyFinancesOut(income=income, expenses=expenses, balance=income - expenses),
        wealth=WealthSummaryOut(
            total_debt=sum(d.remaining for d in debts),
            total_loans=sum(l.remaining for l in loans),
            total_card_bills=sum(c.bill for c in cards),
        ),
        cards=card_overviews,
        fixed_costs=FixedCostsOverviewOut(confirmed_total=confirmed, estimated_total=estimated),
        gacha=GachaOverviewOut(active_banners=len(active), total_cost=sum(b.cost for b in active), next_due_date=next_due),
        alerts=alerts,
    )
