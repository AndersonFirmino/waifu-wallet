from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(10))       # income | expense
    description: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(100))
    emoji: Mapped[str] = mapped_column(String(10))
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[str] = mapped_column(String(10))       # YYYY-MM-DD


class FixedExpense(Base):
    __tablename__ = "fixed_expenses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String(20))       # fixed | variable
    confidence: Mapped[int] = mapped_column(Integer)    # 0-100 %
    estimate: Mapped[float] = mapped_column(Float)


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    total: Mapped[float] = mapped_column(Float)
    remaining: Mapped[float] = mapped_column(Float)
    rate: Mapped[float] = mapped_column(Float)          # % per month
    due_date: Mapped[str] = mapped_column(String(10))   # YYYY-MM-DD
    installments: Mapped[str] = mapped_column(String(50))  # e.g. "3/12"
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    total: Mapped[float] = mapped_column(Float)
    remaining: Mapped[float] = mapped_column(Float)
    rate: Mapped[float] = mapped_column(Float)
    installment: Mapped[float] = mapped_column(Float)
    next_payment: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD
    installments: Mapped[str] = mapped_column(String(50))


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    brand: Mapped[str] = mapped_column(String(20))      # Mastercard | Visa | Elo | Amex
    last_four: Mapped[str] = mapped_column(String(4))
    limit: Mapped[float] = mapped_column(Float)
    used: Mapped[float] = mapped_column(Float)
    gradient_from: Mapped[str] = mapped_column(String(50))
    gradient_to: Mapped[str] = mapped_column(String(50))
    bill: Mapped[float] = mapped_column(Float)
    closing_day: Mapped[int] = mapped_column(Integer)
    due_day: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))     # open | closed | paid | pending | blocked

    history: Mapped[list[CardBillHistory]] = relationship(
        back_populates="card", cascade="all, delete-orphan"
    )
    items: Mapped[list[CardBillItem]] = relationship(
        back_populates="card", cascade="all, delete-orphan"
    )


class CardBillHistory(Base):
    __tablename__ = "card_bill_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("credit_cards.id"))
    month: Mapped[str] = mapped_column(String(7))       # YYYY-MM
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20))

    card: Mapped[CreditCard] = relationship(back_populates="history")


class CardBillItem(Base):
    __tablename__ = "card_bill_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("credit_cards.id"))
    description: Mapped[str] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float)
    date: Mapped[str] = mapped_column(String(10))

    card: Mapped[CreditCard] = relationship(back_populates="items")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[str] = mapped_column(String(10))       # YYYY-MM-DD
    content: Mapped[str] = mapped_column(String(2000))


class GachaBanner(Base):
    __tablename__ = "gacha_banners"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game: Mapped[str] = mapped_column(String(100))
    banner: Mapped[str] = mapped_column(String(200))
    cost: Mapped[float] = mapped_column(Float)
    start_date: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10))    # YYYY-MM-DD
    priority: Mapped[int] = mapped_column(Integer)       # 1-5
    pulls: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True, default=None)

    images: Mapped[list[GachaBannerImage]] = relationship(
        back_populates="banner", cascade="all, delete-orphan", order_by="GachaBannerImage.sort_order"
    )


class GachaBannerImage(Base):
    __tablename__ = "gacha_banner_images"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    banner_id: Mapped[int] = mapped_column(ForeignKey("gacha_banners.id"))
    url: Mapped[str] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    banner: Mapped[GachaBanner] = relationship(back_populates="images")


class SavingsAccount(Base):
    __tablename__ = "savings_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    bank: Mapped[str] = mapped_column(String(200))
    balance: Mapped[float] = mapped_column(Float)
    goal: Mapped[float] = mapped_column(Float)
    emoji: Mapped[str] = mapped_column(String(10), default="🐷")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class SalaryPlan(Base):
    __tablename__ = "salary_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employer: Mapped[str] = mapped_column(String(200))
    current_salary: Mapped[float] = mapped_column(Float)
    target_salary: Mapped[float] = mapped_column(Float)
    increment: Mapped[float] = mapped_column(Float)
    increment_interval_months: Mapped[int] = mapped_column(Integer)
    next_increment_date: Mapped[str] = mapped_column(String(10))    # YYYY-MM-DD
    split_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    split_start_date: Mapped[date | None] = mapped_column(Date, nullable=True, default=None)
    split_first_pct: Mapped[int] = mapped_column(Integer, default=100)
    split_first_day: Mapped[int] = mapped_column(Integer, default=5)
    split_second_pct: Mapped[int] = mapped_column(Integer, default=0)
    split_second_day: Mapped[int] = mapped_column(Integer, default=25)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
