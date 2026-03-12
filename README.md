# MeuCaixa

Personal finance dashboard with a heavy focus on **gacha spending strategy**. Built to give a full picture of income, expenses, debts, savings, and upcoming gacha banners — all in one place.

---

## Features

- **Dashboard** — balance overview, payday countdown, advisor notes, financial timeline roadmap
- **Gacha Tracker** — banner management with image carousel, live countdown, budget safety analysis
- **Transactions** — income/expense log with categories
- **Credit Cards** — multi-card management with bill tracking and limit visualization
- **Fixed Expenses** — recurring costs with EMA-based next-month forecast
- **Debts & Loans** — installment tracking with urgency alerts and progress bars
- **Savings** — savings accounts with goal tracking
- **Salary Plans** — salary progression planning with split payment support and 12-month projection
- **Forecast** — balance projection for 1/3/6 months (base, optimistic, pessimistic scenarios)
- **Financial Calendar** — monthly view of all income, expenses, and installments by day
- **Notes** — markdown notes panel (used by the AI advisor to leave persistent observations)

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.14 + FastAPI + SQLAlchemy + SQLite |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Charts | Recharts |
| Package manager (backend) | uv |
| Package manager (frontend) | npm |

---

## Project Structure

```
MeuCaixa/
├── backend/
│   ├── routers/          # One file per feature module
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # SQLite engine + session setup
│   ├── main.py           # FastAPI app, CORS, router registration
│   ├── seed.py           # Optional: seed script for sample data
│   ├── tests/            # pytest test suite
│   └── pyproject.toml    # Dependencies managed by uv
└── frontend/
    ├── src/
    │   ├── pages/        # One file per route/screen
    │   ├── components/   # Shared UI components
    │   ├── hooks/        # useFetch, etc.
    │   ├── lib/          # Typed decoders (decode.ts)
    │   ├── utils/        # currency, date formatters
    │   └── types/        # TypeScript domain types
    ├── public/
    │   └── gacha/        # Uploaded banner images (local only, gitignored)
    └── package.json
```

---

## Getting Started

### Requirements

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) — `pip install uv` or `winget install astral-sh.uv`
- Node.js 20+
- npm

---

### 1. Backend

```bash
cd backend

# Install dependencies
uv sync

# Start the API server (runs on http://localhost:8000)
uv run uvicorn main:app --reload
```

The SQLite database (`meucaixa.db`) is created automatically on first run. It is **gitignored** — your data never leaves your machine.

Interactive API docs available at: `http://localhost:8000/docs`

#### Run backend tests

```bash
cd backend
uv run pytest
```

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev
```

The frontend proxies all `/api/v1/` requests to `http://localhost:8000` via Vite config.

#### Other frontend commands

```bash
npm run typecheck      # TypeScript check
npm run lint           # ESLint strict check
npm run lint:fix       # Auto-fix lint issues
npm run test           # Run vitest suite
npm run test:coverage  # Coverage report
npm run build          # Production build
```

---

### 3. (Optional) Seed sample data

If you want to start with some example data instead of a blank database:

```bash
cd backend
uv run python seed.py
```

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Resource | Endpoint |
|---|---|
| Summary | `GET /summary/` |
| Transactions | `GET/POST/DELETE /transactions/` |
| Fixed Expenses | `GET/POST/DELETE /fixed-expenses/` |
| Credit Cards | `GET/POST/PUT/DELETE /credit-cards/` |
| Debts | `GET/POST/PUT/DELETE /debts/` |
| Loans | `GET/POST/PUT/DELETE /loans/` |
| Savings | `GET/POST/PUT/DELETE /savings/` |
| Salary Plans | `GET/POST/PUT/DELETE /salary-plans/` |
| Gacha Banners | `GET/POST/PUT/DELETE /gacha/banners/` |
| Banner Images | `POST/DELETE /gacha/banners/{id}/images` |
| Image Upload | `POST /upload/gacha` |
| Notes | `GET/POST/PUT/DELETE /notes/` |
| Forecast | `GET /forecast/?period=1m\|3m\|6m` |
| Calendar | `GET /calendar/{year}/{month}` |

Full interactive documentation: `http://localhost:8000/docs`

---

## Data & Privacy

- All data is stored in a local SQLite file (`backend/meucaixa.db`)
- The database is **gitignored** — it will never be committed
- Uploaded gacha images are stored in `frontend/public/gacha/` — also **gitignored**
- No telemetry, no external services, no accounts required

---

## Development Notes

- **TypeScript**: strict mode, no `any`, no type assertions
- **ESLint**: `typescript-eslint` strict + type-checked, must pass clean before commit
- **Decoders**: all API responses go through typed decoder functions in `src/lib/decode.ts`
- **Commit style**: Gitmoji + Conventional Commits (`✨ feat:`, `🐛 fix:`, etc.)
