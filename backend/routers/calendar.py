from __future__ import annotations

import calendar as cal_module
from datetime import date, timedelta

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import CardSubscription, CreditCard, Debt, Loan, SalaryPlan, Transaction
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


def _next_business_day(
    year: int, month: int, day: int, holiday_dates: set[date]
) -> int:
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


def _make_shifted_event(
    year: int,
    month: int,
    original_day: int,
    holiday_dates: set[date],
    *,
    event_type: str,
    description: str,
    amount: float,
    description_key: str,
    description_params: dict[str, str],
) -> CalendarEventOut | None:
    """Create a calendar event, shifting to the next business day if needed.

    Returns None if the shifted date falls into the next month.
    Automatically appends ``_postponed`` to the key and ``(adiado de N)``
    to the fallback description when a shift occurs.
    """
    shifted_day = _next_business_day(year, month, original_day, holiday_dates)
    if shifted_day == -1:
        return None
    postponed = shifted_day != original_day
    return CalendarEventOut(
        day=shifted_day,
        type=event_type,
        description=(
            f"{description} (adiado de {original_day})" if postponed else description
        ),
        amount=amount,
        description_key=(
            f"{description_key}_postponed" if postponed else description_key
        ),
        description_params=(
            {**description_params, "original_day": str(original_day)}
            if postponed
            else description_params
        ),
    )


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
                    description_key="calendar_event.holiday",
                    description_params={"name": h.get("name", "Feriado")},
                )
            )

    # Transactions in the month — NOT shifted (already recorded on their actual date)
    txs = db.scalars(
        select(Transaction).where(Transaction.date.like(f"{prefix}%"))
    ).all()
    for tx in txs:
        day = int(tx.date.split("-")[2])
        events.append(
            CalendarEventOut(
                day=day,
                type=tx.type,
                description=tx.description,
                amount=tx.amount,
            )
        )

    # Debt due dates in the month
    debts = db.scalars(select(Debt).where(Debt.due_date.like(f"{prefix}%"))).all()
    for debt in debts:
        ev = _make_shifted_event(
            year,
            month,
            int(debt.due_date.split("-")[2]),
            holiday_dates,
            event_type="installment",
            description=debt.name,
            amount=debt.remaining,
            description_key="calendar_event.debt",
            description_params={"name": debt.name},
        )
        if ev is not None:
            events.append(ev)

    # Loan next payments in the month
    loans = db.scalars(select(Loan).where(Loan.next_payment.like(f"{prefix}%"))).all()
    for loan in loans:
        ev = _make_shifted_event(
            year,
            month,
            int(loan.next_payment.split("-")[2]),
            holiday_dates,
            event_type="installment",
            description=loan.name,
            amount=loan.installment,
            description_key="calendar_event.loan",
            description_params={"name": loan.name},
        )
        if ev is not None:
            events.append(ev)

    # Credit card bill due dates (recurring monthly)
    cards = db.scalars(select(CreditCard)).all()
    for card in cards:
        if card.bill > 0:
            ev = _make_shifted_event(
                year,
                month,
                card.due_day,
                holiday_dates,
                event_type="expense",
                description=f"Fatura {card.name}",
                amount=card.bill,
                description_key="calendar_event.card_bill",
                description_params={"name": card.name},
            )
            if ev is not None:
                events.append(ev)

    # Active subscription billing dates (recurring monthly)
    subscriptions = db.scalars(
        select(CardSubscription).where(CardSubscription.active.is_(True))
    ).all()
    for sub in subscriptions:
        card_name = sub.card.name
        ev = _make_shifted_event(
            year,
            month,
            sub.billing_day,
            holiday_dates,
            event_type="expense",
            description=f"{sub.name} ({card_name})",
            amount=sub.amount,
            description_key="calendar_event.subscription",
            description_params={"name": sub.name, "card": card_name},
        )
        if ev is not None:
            events.append(ev)

    # Active salary plan payment dates (recurring monthly)
    salary_plans = db.scalars(
        select(SalaryPlan).where(SalaryPlan.active.is_(True))
    ).all()
    for plan in salary_plans:
        if not plan.split_enabled:
            ev = _make_shifted_event(
                year,
                month,
                plan.split_first_day,
                holiday_dates,
                event_type="salary",
                description=f"Salário — {plan.employer}",
                amount=plan.current_salary,
                description_key="calendar_event.salary",
                description_params={"employer": plan.employer},
            )
            if ev is not None:
                events.append(ev)
        else:
            first = _make_shifted_event(
                year,
                month,
                plan.split_first_day,
                holiday_dates,
                event_type="salary",
                description=f"Salário 1ª parte — {plan.employer}",
                amount=plan.current_salary * plan.split_first_pct / 100,
                description_key="calendar_event.salary_first",
                description_params={"employer": plan.employer},
            )
            if first is not None:
                events.append(first)
            second = _make_shifted_event(
                year,
                month,
                plan.split_second_day,
                holiday_dates,
                event_type="salary",
                description=f"Salário 2ª parte — {plan.employer}",
                amount=plan.current_salary * plan.split_second_pct / 100,
                description_key="calendar_event.salary_second",
                description_params={"employer": plan.employer},
            )
            if second is not None:
                events.append(second)

    return sorted(events, key=lambda e: e.day)
