from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Debt, Loan, Transaction
from schemas import CalendarEventOut

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/{year}/{month}", response_model=list[CalendarEventOut])
def get_calendar_events(
    year: int,
    month: int,
    db: Session = Depends(get_db),
) -> list[CalendarEventOut]:
    events: list[CalendarEventOut] = []
    prefix = f"{year:04d}-{month:02d}-"

    # Transactions in the month
    txs = db.scalars(
        select(Transaction).where(Transaction.date.like(f"{prefix}%"))
    ).all()
    for tx in txs:
        day = int(tx.date.split("-")[2])
        events.append(CalendarEventOut(day=day, type=tx.type, description=tx.description, amount=tx.amount))

    # Debt due dates in the month
    debts = db.scalars(select(Debt).where(Debt.due_date.like(f"{prefix}%"))).all()
    for debt in debts:
        day = int(debt.due_date.split("-")[2])
        events.append(CalendarEventOut(day=day, type="installment", description=debt.name, amount=debt.remaining))

    # Loan next payments in the month
    loans = db.scalars(
        select(Loan).where(Loan.next_payment.like(f"{prefix}%"))
    ).all()
    for loan in loans:
        day = int(loan.next_payment.split("-")[2])
        events.append(CalendarEventOut(day=day, type="installment", description=loan.name, amount=loan.installment))

    return sorted(events, key=lambda e: e.day)
