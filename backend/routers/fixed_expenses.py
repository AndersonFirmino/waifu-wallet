from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import FixedExpense
from schemas import FixedExpenseCreate, FixedExpenseOut

router = APIRouter(prefix="/fixed-expenses", tags=["fixed-expenses"])


@router.get("/", response_model=list[FixedExpenseOut])
def list_fixed_expenses(db: Session = Depends(get_db)) -> list[FixedExpense]:
    return list(db.scalars(select(FixedExpense)).all())


@router.post("/", response_model=FixedExpenseOut, status_code=201)
def create_fixed_expense(
    body: FixedExpenseCreate,
    db: Session = Depends(get_db),
) -> FixedExpense:
    expense = FixedExpense(**body.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=FixedExpenseOut)
def update_fixed_expense(
    expense_id: int,
    body: FixedExpenseCreate,
    db: Session = Depends(get_db),
) -> FixedExpense:
    expense = db.get(FixedExpense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    for field, value in body.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_fixed_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    expense = db.get(FixedExpense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    db.delete(expense)
    db.commit()
