from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import calendar, credit_cards, debts, fixed_expenses, forecast, gacha, notes, salary_plans, savings, settings, summary, transactions, upload

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

# ─── Migrations ──────────────────────────────────────────────────────────────
from sqlalchemy import text, inspect
from sqlalchemy.exc import OperationalError


def _run_migrations() -> None:
    with engine.connect() as conn:
        # Add char_current / weapon_current to gacha_banners
        for col in ("char_current", "weapon_current"):
            try:
                conn.execute(text(f"ALTER TABLE gacha_banners ADD COLUMN {col} VARCHAR(5)"))
                conn.commit()
            except OperationalError:
                conn.rollback()

        # Add weapon_passes to gacha_stashes
        try:
            conn.execute(text("ALTER TABLE gacha_stashes ADD COLUMN weapon_passes INTEGER DEFAULT 0"))
            conn.commit()
        except OperationalError:
            conn.rollback()

        # Migrate old gacha_stash → gacha_stashes
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if "gacha_stash" in tables and "gacha_stashes" in tables:
            existing = conn.execute(text("SELECT COUNT(*) FROM gacha_stashes")).scalar()
            if existing == 0:
                old = conn.execute(text("SELECT stellar_jade, special_passes, double_gems_available FROM gacha_stash LIMIT 1")).fetchone()
                if old is not None:
                    conn.execute(
                        text("INSERT INTO gacha_stashes (game, premium_currency, passes, double_gems_available) VALUES (:game, :currency, :passes, :double)"),
                        {"game": "Honkai: Star Rail", "currency": old[0], "passes": old[1], "double": old[2]},
                    )
                    conn.commit()


_run_migrations()

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
app.include_router(salary_plans.router, prefix=PREFIX)
app.include_router(savings.router, prefix=PREFIX)
app.include_router(summary.router, prefix=PREFIX)
app.include_router(upload.router, prefix=PREFIX)
app.include_router(settings.router, prefix=PREFIX)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"status": "ok", "docs": "/docs"}
