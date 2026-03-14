from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Transaction
from schemas import TransactionCreate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
) -> list[Transaction]:
    stmt = select(Transaction).order_by(Transaction.date.desc())
    if month is not None and year is not None:
        prefix = f"{year:04d}-{month:02d}-"
        stmt = stmt.where(Transaction.date.like(f"{prefix}%"))
    return list(db.scalars(stmt).all())


@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
) -> Transaction:
    tx = Transaction(**body.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    body: TransactionCreate,
    db: Session = Depends(get_db),
) -> Transaction:
    tx = db.get(Transaction, tx_id)
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in body.model_dump().items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)) -> None:
    tx = db.get(Transaction, tx_id)
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
