from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import SalaryPlan
from schemas import (
    SalaryPlanCreate,
    SalaryPlanOut,
    SalaryScheduleMonth,
    SalarySchedulePayment,
)

router = APIRouter(prefix="/salary-plans", tags=["salary-plans"])


# ─── CRUD ─────────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[SalaryPlanOut])
def list_salary_plans(db: Session = Depends(get_db)) -> list[SalaryPlan]:
    return list(db.scalars(select(SalaryPlan)).all())


@router.post("/", response_model=SalaryPlanOut, status_code=201)
def create_salary_plan(
    body: SalaryPlanCreate, db: Session = Depends(get_db)
) -> SalaryPlan:
    plan = SalaryPlan(**body.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{plan_id}", response_model=SalaryPlanOut)
def update_salary_plan(
    plan_id: int,
    body: SalaryPlanCreate,
    db: Session = Depends(get_db),
) -> SalaryPlan:
    plan = db.get(SalaryPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Salary plan not found")
    for field, value in body.model_dump().items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
def delete_salary_plan(plan_id: int, db: Session = Depends(get_db)) -> None:
    plan = db.get(SalaryPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Salary plan not found")
    db.delete(plan)
    db.commit()


# ─── Schedule projection ──────────────────────────────────────────────────────


def _add_months(d: date, months: int) -> date:
    """Advance a date by N calendar months, clamping to end-of-month."""
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    # Clamp to valid day in the resulting month
    import calendar

    last_day = calendar.monthrange(year, month)[1]
    day = min(d.day, last_day)
    return date(year, month, day)


def _month_label(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


@router.get("/{plan_id}/schedule", response_model=list[SalaryScheduleMonth])
def get_salary_schedule(
    plan_id: int,
    months: int = 6,
    db: Session = Depends(get_db),
) -> list[SalaryScheduleMonth]:
    plan = db.get(SalaryPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Salary plan not found")

    # Parse next_increment_date
    next_increment = date.fromisoformat(plan.next_increment_date)

    # Working copies — do NOT touch the ORM object
    current_salary = plan.current_salary
    target_salary = plan.target_salary
    increment = plan.increment
    interval = plan.increment_interval_months

    # Start projection from the current calendar month
    today = date.today()
    cursor = date(today.year, today.month, 1)

    schedule: list[SalaryScheduleMonth] = []

    for _ in range(months):
        cursor_month_start = date(cursor.year, cursor.month, 1)

        # Apply increment if this month >= next_increment month and cap not reached
        next_inc_month_start = date(next_increment.year, next_increment.month, 1)
        if (
            cursor_month_start >= next_inc_month_start
            and current_salary < target_salary
        ):
            current_salary = min(current_salary + increment, target_salary)
            next_increment = _add_months(next_increment, interval)

        # Determine whether split applies for this month.
        # If split_start_date is set, the split only takes effect from that month onward.
        split_active = plan.split_enabled
        if split_active and plan.split_start_date is not None:
            split_start_month = date(
                plan.split_start_date.year, plan.split_start_date.month, 1
            )
            split_active = cursor_month_start >= split_start_month

        # Build payments
        payments: list[SalarySchedulePayment] = []
        if split_active:
            first_amount = round(current_salary * plan.split_first_pct / 100, 2)
            second_amount = round(current_salary * plan.split_second_pct / 100, 2)
            payments.append(
                SalarySchedulePayment(
                    day=plan.split_first_day,
                    amount=first_amount,
                    label=f"{plan.employer} ({plan.split_first_pct}%)",
                )
            )
            payments.append(
                SalarySchedulePayment(
                    day=plan.split_second_day,
                    amount=second_amount,
                    label=f"{plan.employer} ({plan.split_second_pct}%)",
                )
            )
        else:
            payments.append(
                SalarySchedulePayment(
                    day=plan.split_first_day,
                    amount=round(current_salary, 2),
                    label=plan.employer,
                )
            )

        schedule.append(
            SalaryScheduleMonth(
                month=_month_label(cursor),
                salary=round(current_salary, 2),
                payments=payments,
            )
        )

        cursor = _add_months(cursor, 1)

    return schedule
