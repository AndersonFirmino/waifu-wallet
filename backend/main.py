from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import calendar, credit_cards, debts, fixed_expenses, forecast, gacha, notes, summary, transactions

app = FastAPI(
    title="MeuCaixa API",
    description="API pessoal de controle financeiro. Use /api/v1/summary para uma visão geral completa.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas no banco se não existirem
Base.metadata.create_all(bind=engine)

# Registra todos os routers sob /api/v1
PREFIX = "/api/v1"

app.include_router(transactions.router, prefix=PREFIX)
app.include_router(fixed_expenses.router, prefix=PREFIX)
app.include_router(debts.router, prefix=PREFIX)
app.include_router(credit_cards.router, prefix=PREFIX)
app.include_router(notes.router, prefix=PREFIX)
app.include_router(gacha.router, prefix=PREFIX)
app.include_router(calendar.router, prefix=PREFIX)
app.include_router(forecast.router, prefix=PREFIX)
app.include_router(summary.router, prefix=PREFIX)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"status": "ok", "docs": "/docs"}
