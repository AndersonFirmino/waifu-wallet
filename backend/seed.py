"""Populates the database with sample data mirroring the frontend mocks."""
from __future__ import annotations

from sqlalchemy.orm import Session

from database import Base, engine
from models import (
    CardBillHistory,
    CardBillItem,
    CreditCard,
    Debt,
    FixedExpense,
    GachaBanner,
    Loan,
    Note,
    Transaction,
)

Base.metadata.create_all(bind=engine)


def seed() -> None:
    with Session(engine) as db:
        # Clear existing data
        for model in [CardBillItem, CardBillHistory, CreditCard, Transaction,
                      FixedExpense, Debt, Loan, Note, GachaBanner]:
            db.query(model).delete()
        db.commit()

        # ── Transactions ──────────────────────────────────────────────────────
        transactions = [
            Transaction(type="income",  description="Salario",       category="Salario",     emoji="💼", amount=6500,  date="2026-03-05"),
            Transaction(type="expense", description="Aluguel",       category="Moradia",     emoji="🏠", amount=1200,  date="2026-03-01"),
            Transaction(type="expense", description="Mercado",       category="Alimentacao", emoji="🛒", amount=450,   date="2026-03-08"),
            Transaction(type="expense", description="Conta de Luz",  category="Utilidades",  emoji="⚡", amount=180,   date="2026-03-10"),
            Transaction(type="expense", description="Netflix",       category="Lazer",       emoji="🎬", amount=45.90, date="2026-03-03"),
            Transaction(type="expense", description="Academia",      category="Saude",       emoji="🏋", amount=99,    date="2026-03-02"),
            Transaction(type="income",  description="Freelance",     category="Extra",       emoji="💻", amount=800,   date="2026-03-15"),
            Transaction(type="expense", description="Farmacia",      category="Saude",       emoji="💊", amount=87.50, date="2026-03-12"),
            Transaction(type="expense", description="Gasolina",      category="Transporte",  emoji="⛽", amount=200,   date="2026-03-07"),
            Transaction(type="expense", description="Restaurante",   category="Alimentacao", emoji="🍽", amount=135,   date="2026-03-09"),
            # February
            Transaction(type="income",  description="Salario",       category="Salario",     emoji="💼", amount=6500,  date="2026-02-05"),
            Transaction(type="expense", description="Aluguel",       category="Moradia",     emoji="🏠", amount=1200,  date="2026-02-01"),
            Transaction(type="expense", description="Mercado",       category="Alimentacao", emoji="🛒", amount=520,   date="2026-02-08"),
            Transaction(type="expense", description="Internet",      category="Utilidades",  emoji="📶", amount=120,   date="2026-02-10"),
            # January
            Transaction(type="income",  description="Salario",       category="Salario",     emoji="💼", amount=6200,  date="2026-01-05"),
            Transaction(type="expense", description="Aluguel",       category="Moradia",     emoji="🏠", amount=1200,  date="2026-01-01"),
            Transaction(type="expense", description="Mercado",       category="Alimentacao", emoji="🛒", amount=480,   date="2026-01-08"),
        ]
        db.add_all(transactions)

        # ── Fixed expenses ────────────────────────────────────────────────────
        fixed_expenses = [
            FixedExpense(name="Aluguel",        amount=1200,  type="fixed",    confidence=100, estimate=1200),
            FixedExpense(name="Internet",       amount=120,   type="fixed",    confidence=100, estimate=120),
            FixedExpense(name="Energia",        amount=180,   type="variable", confidence=75,  estimate=200),
            FixedExpense(name="Academia",       amount=99,    type="fixed",    confidence=100, estimate=99),
            FixedExpense(name="Netflix",        amount=45.90, type="fixed",    confidence=100, estimate=45.90),
            FixedExpense(name="Spotify",        amount=21.90, type="fixed",    confidence=100, estimate=21.90),
            FixedExpense(name="Plano de Saude", amount=380,   type="fixed",    confidence=100, estimate=380),
            FixedExpense(name="Condominio",     amount=350,   type="variable", confidence=80,  estimate=380),
        ]
        db.add_all(fixed_expenses)

        # ── Debts ─────────────────────────────────────────────────────────────
        debts = [
            Debt(name="Nubank Parcelado", total=3600, remaining=2400, rate=2.99, due_date="2026-03-15", installments="4/12",  urgent=True),
            Debt(name="Emprestimo Banco", total=8000, remaining=5750, rate=1.89, due_date="2026-04-10", installments="8/24",  urgent=False),
            Debt(name="Cartao Magazine",  total=1200, remaining=600,  rate=3.50, due_date="2026-03-22", installments="3/6",   urgent=False),
            Debt(name="Financiamento TV", total=2400, remaining=1400, rate=1.20, due_date="2026-05-01", installments="10/20", urgent=False),
        ]
        db.add_all(debts)

        # ── Loans ─────────────────────────────────────────────────────────────
        loans = [
            Loan(name="Caixa Economica",    total=15000, remaining=12500, rate=0.89, installment=650, next_payment="2026-03-20", installments="6/24"),
            Loan(name="Emprestimo Pessoal", total=5000,  remaining=2500,  rate=1.50, installment=280, next_payment="2026-03-28", installments="12/20"),
        ]
        db.add_all(loans)

        # ── Credit cards ──────────────────────────────────────────────────────
        nubank = CreditCard(
            name="Nubank",  brand="Mastercard", last_four="4921",
            limit=5000,     used=3250,
            gradient_from="#8B5CF6", gradient_to="#6D28D9",
            bill=850,       closing_day=25, due_day=8,  status="open",
        )
        itau = CreditCard(
            name="Itau",    brand="Visa",       last_four="7734",
            limit=8000,     used=6800,
            gradient_from="#F97316", gradient_to="#EA580C",
            bill=1200,      closing_day=18, due_day=5,  status="closed",
        )
        db.add_all([nubank, itau])
        db.flush()

        db.add_all([
            CardBillHistory(card_id=nubank.id, month="2025-12", amount=720,  status="paid"),
            CardBillHistory(card_id=nubank.id, month="2026-01", amount=650,  status="paid"),
            CardBillHistory(card_id=nubank.id, month="2026-02", amount=910,  status="paid"),
            CardBillHistory(card_id=nubank.id, month="2026-03", amount=850,  status="open"),
            CardBillHistory(card_id=itau.id,   month="2026-01", amount=1050, status="paid"),
            CardBillHistory(card_id=itau.id,   month="2026-02", amount=1180, status="paid"),
            CardBillHistory(card_id=itau.id,   month="2026-03", amount=1200, status="closed"),
        ])
        db.add_all([
            CardBillItem(card_id=nubank.id, description="iFood",          amount=89.90,  date="2026-03-02"),
            CardBillItem(card_id=nubank.id, description="Steam",          amount=199,    date="2026-03-05"),
            CardBillItem(card_id=nubank.id, description="Amazon",         amount=159.90, date="2026-03-08"),
            CardBillItem(card_id=itau.id,   description="Passagem aerea", amount=850,    date="2026-03-01"),
            CardBillItem(card_id=itau.id,   description="Hotel",          amount=320,    date="2026-03-10"),
        ])

        # ── Notes ─────────────────────────────────────────────────────────────
        notes = [
            Note(date="2026-03-11", content="Lembrar de negociar divida do Nubank antes do vencimento dia 15."),
            Note(date="2026-03-08", content="Pesquisar planos de saude mais baratos. Atual esta pesando no orcamento."),
            Note(date="2026-02-20", content="Meta: economizar R$ 1.000 por mes para reserva de emergencia."),
        ]
        db.add_all(notes)

        # ── Gacha banners ─────────────────────────────────────────────────────
        banners = [
            GachaBanner(game="Genshin Impact",  banner="Chiori",       cost=180, start_date="2026-03-01", end_date="2026-03-26", priority=1, pulls=43),
            GachaBanner(game="Honkai Star Rail", banner="Firefly",      cost=160, start_date="2026-03-05", end_date="2026-04-02", priority=2, pulls=12),
            GachaBanner(game="Wuthering Waves",  banner="Camellya",     cost=120, start_date="2026-03-10", end_date="2026-03-31", priority=3, pulls=0),
            GachaBanner(game="Blue Archive",     banner="Ako (event)",  cost=80,  start_date="2026-03-12", end_date="2026-03-25", priority=4, pulls=0),
        ]
        db.add_all(banners)

        db.commit()
        print("Seed complete.")
        print(f"  {len(transactions)} transactions, {len(fixed_expenses)} fixed expenses")
        print(f"  {len(debts)} debts, {len(loans)} loans, 2 credit cards")
        print(f"  {len(notes)} notes, {len(banners)} gacha banners")


if __name__ == "__main__":
    seed()
