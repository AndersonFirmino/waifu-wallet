from __future__ import annotations

import calendar as cal_module
from datetime import date, timedelta

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import CardSubscription, CreditCard, Debt, Loan, Transaction
from schemas import CalendarEventOut

router = APIRouter(prefix="/calendar", tags=["calendar"])

_holidays_cache: dict[int, list[dict[str, str]]] = {}


def _fetch_holidays(year: int) -> list[dict[str, str]]:
    if year in _holidays_cache:
        return _holidays_cache[year]
    try:
        r = httpx.get(f"https://brasilapi.com.br/api/feriados/v1/{year}", timeout=5.0)
        r.raise_for_status()
        data: list[dict[str, str]] = r.json()
        _holidays_cache[year] = data
        return data
    except Exception:
        _holidays_cache[year] = []
        return []


def _build_holiday_set(year: int, holidays_raw: list[dict[str, str]]) -> set[date]:
    result: set[date] = set()
    for h in holidays_raw:
        try:
            result.add(date.fromisoformat(h["date"]))
        except (KeyError, ValueError):
            pass
    return result


def _next_business_day(year: int, month: int, day: int, holiday_dates: set[date]) -> int:
    """If the given day is a weekend or holiday, return the next business day's day number.

    Returns -1 if the shifted date falls into the next month (caller should skip the event).
    """
    max_day = cal_module.monthrange(year, month)[1]
    day = min(day, max_day)
    d = date(year, month, day)

    while d.weekday() >= 5 or d in holiday_dates:  # 5=Saturday, 6=Sunday
        d += timedelta(days=1)

    if d.month != month:
        return -1  # shifted into next month, do not show in current month

    return d.day


@router.get("/{year}/{month}", response_model=list[CalendarEventOut])
def get_calendar_events(
    year: int,
    month: int,
    db: Session = Depends(get_db),
) -> list[CalendarEventOut]:
    events: list[CalendarEventOut] = []
    prefix = f"{year:04d}-{month:02d}-"

    # Fetch holidays for the year and build a lookup set
    holidays_raw = _fetch_holidays(year)
    holiday_dates = _build_holiday_set(year, holidays_raw)

    # Holiday events for the requested month
    for h in holidays_raw:
        h_date_str = h.get("date", "")
        if h_date_str.startswith(prefix):
            h_day = int(h_date_str.split("-")[2])
            events.append(
                CalendarEventOut(
                    day=h_day,
                    type="holiday",
                    description=h.get("name", "Feriado"),
                    amount=0,
                )
            )

    # Transactions in the month — NOT shifted (already recorded on their actual date)
    txs = db.scalars(
        select(Transaction).where(Transaction.date.like(f"{prefix}%"))
    ).all()
    for tx in txs:
        day = int(tx.date.split("-")[2])
        events.append(CalendarEventOut(day=day, type=tx.type, description=tx.description, amount=tx.amount))

    # Debt due dates in the month — shift if holiday/weekend
    debts = db.scalars(select(Debt).where(Debt.due_date.like(f"{prefix}%"))).all()
    for debt in debts:
        original_day = int(debt.due_date.split("-")[2])
        shifted_day = _next_business_day(year, month, original_day, holiday_dates)
        if shifted_day == -1:
            continue  # shifted into next month
        description = debt.name
        if shifted_day != original_day:
            description = f"{debt.name} (adiado de {original_day})"
        events.append(CalendarEventOut(day=shifted_day, type="installment", description=description, amount=debt.remaining))

    # Loan next payments in the month — shift if holiday/weekend
    loans = db.scalars(
        select(Loan).where(Loan.next_payment.like(f"{prefix}%"))
    ).all()
    for loan in loans:
        original_day = int(loan.next_payment.split("-")[2])
        shifted_day = _next_business_day(year, month, original_day, holiday_dates)
        if shifted_day == -1:
            continue
        description = loan.name
        if shifted_day != original_day:
            description = f"{loan.name} (adiado de {original_day})"
        events.append(CalendarEventOut(day=shifted_day, type="installment", description=description, amount=loan.installment))

    # Credit card bill due dates (recurring monthly) — shift if holiday/weekend
    cards = db.scalars(select(CreditCard)).all()
    for card in cards:
        if card.bill > 0:
            original_day = card.due_day
            shifted_day = _next_business_day(year, month, original_day, holiday_dates)
            if shifted_day == -1:
                continue
            description = f"Fatura {card.name}"
            if shifted_day != original_day:
                description = f"Fatura {card.name} (adiado de {original_day})"
            events.append(
                CalendarEventOut(
                    day=shifted_day,
                    type="expense",
                    description=description,
                    amount=card.bill,
                )
            )

    # Active subscription billing dates (recurring monthly) — shift if holiday/weekend
    subscriptions = db.scalars(
        select(CardSubscription).where(CardSubscription.active.is_(True))
    ).all()
    for sub in subscriptions:
        card_name = sub.card.name
        original_day = sub.billing_day
        shifted_day = _next_business_day(year, month, original_day, holiday_dates)
        if shifted_day == -1:
            continue
        description = f"{sub.name} ({card_name})"
        if shifted_day != original_day:
            description = f"{sub.name} ({card_name}) (adiado de {original_day})"
        events.append(
            CalendarEventOut(
                day=shifted_day,
                type="expense",
                description=description,
                amount=sub.amount,
            )
        )

    return sorted(events, key=lambda e: e.day)
