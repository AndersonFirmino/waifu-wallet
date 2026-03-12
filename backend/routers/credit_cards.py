from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import CardBillHistory, CardBillItem, CreditCard
from schemas import (
    CardBillHistoryCreate,
    CardBillHistoryOut,
    CardBillItemCreate,
    CardBillItemOut,
    CreditCardCreate,
    CreditCardOut,
)

router = APIRouter(prefix="/credit-cards", tags=["credit-cards"])


@router.get("/", response_model=list[CreditCardOut])
def list_credit_cards(db: Session = Depends(get_db)) -> list[CreditCard]:
    return list(db.scalars(select(CreditCard)).all())


@router.post("/", response_model=CreditCardOut, status_code=201)
def create_credit_card(
    body: CreditCardCreate,
    db: Session = Depends(get_db),
) -> CreditCard:
    card = CreditCard(**body.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=CreditCardOut)
def update_credit_card(
    card_id: int,
    body: CreditCardCreate,
    db: Session = Depends(get_db),
) -> CreditCard:
    card = db.get(CreditCard, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Credit card not found")
    for field, value in body.model_dump().items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_credit_card(card_id: int, db: Session = Depends(get_db)) -> None:
    card = db.get(CreditCard, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Credit card not found")
    db.delete(card)
    db.commit()


# ─── Bill history ─────────────────────────────────────────────────────────────

@router.post("/{card_id}/history", response_model=CardBillHistoryOut, status_code=201)
def add_history(
    card_id: int,
    body: CardBillHistoryCreate,
    db: Session = Depends(get_db),
) -> CardBillHistory:
    if db.get(CreditCard, card_id) is None:
        raise HTTPException(status_code=404, detail="Credit card not found")
    entry = CardBillHistory(card_id=card_id, **body.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{card_id}/history/{hist_id}", status_code=204)
def delete_history(
    card_id: int,
    hist_id: int,
    db: Session = Depends(get_db),
) -> None:
    entry = db.get(CardBillHistory, hist_id)
    if entry is None or entry.card_id != card_id:
        raise HTTPException(status_code=404, detail="Bill history entry not found")
    db.delete(entry)
    db.commit()


# ─── Bill items ───────────────────────────────────────────────────────────────

@router.post("/{card_id}/items", response_model=CardBillItemOut, status_code=201)
def add_item(
    card_id: int,
    body: CardBillItemCreate,
    db: Session = Depends(get_db),
) -> CardBillItem:
    if db.get(CreditCard, card_id) is None:
        raise HTTPException(status_code=404, detail="Credit card not found")
    item = CardBillItem(card_id=card_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{card_id}/items/{item_id}", status_code=204)
def delete_item(
    card_id: int,
    item_id: int,
    db: Session = Depends(get_db),
) -> None:
    item = db.get(CardBillItem, item_id)
    if item is None or item.card_id != card_id:
        raise HTTPException(status_code=404, detail="Bill item not found")
    db.delete(item)
    db.commit()
