from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Transaction
from schemas import ForecastPointOut

router = APIRouter(prefix="/forecast", tags=["forecast"])

_MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

_PERIOD_MAP: dict[str, int] = {"1m": 1, "3m": 3, "6m": 6}


@router.get("/", response_model=list[ForecastPointOut])
def get_forecast(
    period: str = "3m",
    db: Session = Depends(get_db),
) -> list[ForecastPointOut]:
    months_ahead = _PERIOD_MAP.get(period, 3)
    today = date.today()

    # Collect last 6 months of data
    buckets: dict[str, tuple[float, float]] = {}
    for i in range(6):
        m = (today.month - 1 - i) % 12 + 1
        y = today.year - ((today.month - 1 - i) < 0)
        buckets[f"{y:04d}-{m:02d}"] = (0.0, 0.0)

    for tx in db.scalars(select(Transaction)).all():
        key = tx.date[:7]
        if key in buckets:
            income, expense = buckets[key]
            if tx.type == "income":
                buckets[key] = (income + tx.amount, expense)
            else:
                buckets[key] = (income, expense + tx.amount)

    values = list(buckets.values())
    avg_income = sum(v[0] for v in values) / len(values) if values else 0.0
    avg_expense = sum(v[1] for v in values) / len(values) if values else 0.0

    points: list[ForecastPointOut] = []
    for i in range(1, months_ahead + 1):
        m = (today.month - 1 + i) % 12 + 1
        y = today.year + (today.month - 1 + i) // 12
        label = f"{_MONTH_LABELS[m - 1]}/{str(y)[2:]}"
        points.append(ForecastPointOut(
            month=label,
            optimistic=round(avg_income * 1.10 - avg_expense * 0.90, 2),
            base=round(avg_income - avg_expense, 2),
            pessimistic=round(avg_income * 0.90 - avg_expense * 1.10, 2),
        ))

    return points
