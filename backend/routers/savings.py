from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import SavingsAccount
from schemas import BalanceUpdate, SavingsAccountCreate, SavingsAccountOut

router = APIRouter(prefix="/savings", tags=["savings"])


@router.get("/", response_model=list[SavingsAccountOut])
def list_savings_accounts(db: Session = Depends(get_db)) -> list[SavingsAccount]:
    return list(db.scalars(select(SavingsAccount)).all())


@router.post("/", response_model=SavingsAccountOut, status_code=201)
def create_savings_account(
    body: SavingsAccountCreate,
    db: Session = Depends(get_db),
) -> SavingsAccount:
    account = SavingsAccount(**body.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=SavingsAccountOut)
def update_savings_account(
    account_id: int,
    body: SavingsAccountCreate,
    db: Session = Depends(get_db),
) -> SavingsAccount:
    account = db.get(SavingsAccount, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Savings account not found")
    for field, value in body.model_dump().items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


@router.patch("/{account_id}/balance", response_model=SavingsAccountOut)
def update_savings_balance(
    account_id: int,
    body: BalanceUpdate,
    db: Session = Depends(get_db),
) -> SavingsAccount:
    account = db.get(SavingsAccount, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Savings account not found")
    account.balance = body.balance
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_savings_account(account_id: int, db: Session = Depends(get_db)) -> None:
    account = db.get(SavingsAccount, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Savings account not found")
    db.delete(account)
    db.commit()
