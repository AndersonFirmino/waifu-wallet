from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Debt, Loan
from schemas import DebtCreate, DebtOut, LoanCreate, LoanOut

router = APIRouter(tags=["debts"])


# ─── Debts ────────────────────────────────────────────────────────────────────


@router.get("/debts", response_model=list[DebtOut])
def list_debts(db: Session = Depends(get_db)) -> list[Debt]:
    return list(db.scalars(select(Debt)).all())


@router.post("/debts", response_model=DebtOut, status_code=201)
def create_debt(body: DebtCreate, db: Session = Depends(get_db)) -> Debt:
    debt = Debt(**body.model_dump())
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return debt


@router.put("/debts/{debt_id}", response_model=DebtOut)
def update_debt(
    debt_id: int,
    body: DebtCreate,
    db: Session = Depends(get_db),
) -> Debt:
    debt = db.get(Debt, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    for field, value in body.model_dump().items():
        setattr(debt, field, value)
    db.commit()
    db.refresh(debt)
    return debt


@router.delete("/debts/{debt_id}", status_code=204)
def delete_debt(debt_id: int, db: Session = Depends(get_db)) -> None:
    debt = db.get(Debt, debt_id)
    if debt is None:
        raise HTTPException(status_code=404, detail="Debt not found")
    db.delete(debt)
    db.commit()


# ─── Loans ────────────────────────────────────────────────────────────────────


@router.get("/loans", response_model=list[LoanOut])
def list_loans(db: Session = Depends(get_db)) -> list[Loan]:
    return list(db.scalars(select(Loan)).all())


@router.post("/loans", response_model=LoanOut, status_code=201)
def create_loan(body: LoanCreate, db: Session = Depends(get_db)) -> Loan:
    loan = Loan(**body.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@router.put("/loans/{loan_id}", response_model=LoanOut)
def update_loan(
    loan_id: int,
    body: LoanCreate,
    db: Session = Depends(get_db),
) -> Loan:
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    for field, value in body.model_dump().items():
        setattr(loan, field, value)
    db.commit()
    db.refresh(loan)
    return loan


@router.delete("/loans/{loan_id}", status_code=204)
def delete_loan(loan_id: int, db: Session = Depends(get_db)) -> None:
    loan = db.get(Loan, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Loan not found")
    db.delete(loan)
    db.commit()
