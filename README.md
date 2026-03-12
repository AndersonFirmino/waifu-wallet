# waifu-wallet

> A personal finance dashboard built for one real purpose: spending smarter on gacha.

Track your income, expenses, debts, and savings — all so you can confidently know exactly how much you can throw at the next banner without destroying your life.

---

## Features

- **Dashboard** — balance overview, payday countdown, AI advisor notes, financial timeline roadmap
- **Gacha Tracker** — banner management with image carousel, live countdown (D/H/M/S), budget safety analysis (safe / caution / danger)
- **Transactions** — income and expense log
- **Credit Cards** — multi-card management with bill tracking and limit visualization
- **Fixed Expenses** — recurring monthly costs with EMA-based forecast
- **Debts & Loans** — installment tracking with urgency alerts and progress bars
- **Savings** — savings accounts with goal tracking
- **Salary Plans** — salary progression planning with split-payment support and 12-month projection
- **Forecast** — balance projection for 1 / 3 / 6 months across base, optimistic, and pessimistic scenarios
- **Financial Calendar** — monthly view of all income, expenses, and installments by day
- **Notes** — markdown notes (designed for an AI advisor to leave persistent observations)

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.14 + FastAPI + SQLAlchemy + SQLite |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS |
| Charts | Recharts |
| Backend packages | [uv](https://github.com/astral-sh/uv) |
| Frontend packages | npm |

---

## Project Structure

```
waifu-wallet/
├── backend/
│   ├── routers/          # One file per feature module
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # SQLite engine + session setup
│   ├── main.py           # FastAPI app, CORS, router registration
│   ├── seed.py           # Optional seed script for sample data
│   ├── tests/            # pytest test suite
│   └── pyproject.toml    # Dependencies (managed by uv)
└── frontend/
    ├── src/
    │   ├── pages/        # One file per route/screen
    │   ├── components/   # Shared UI components
    │   ├── hooks/        # useFetch and other hooks
    │   ├── lib/          # Typed API response decoders
    │   ├── utils/        # Currency and date formatters
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

### 1. Clone

```bash
git clone https://github.com/AndersonFirmino/waifu-wallet.git
cd waifu-wallet
```

### 2. Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

API runs on `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

The SQLite database (`meucaixa.db`) is created automatically on first run. It is gitignored — your data stays local.

#### Run backend tests

```bash
cd backend
uv run pytest
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.
All `/api/v1/` requests are proxied to the backend via Vite config.

#### Other frontend commands

```bash
npm run typecheck      # TypeScript strict check
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix lint issues
npm run test           # Vitest suite
npm run test:coverage  # Coverage report
npm run build          # Production build
```

### 4. (Optional) Seed sample data

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
| Transactions | `GET POST DELETE /transactions/` |
| Fixed Expenses | `GET POST DELETE /fixed-expenses/` |
| Credit Cards | `GET POST PUT DELETE /credit-cards/` |
| Debts | `GET POST PUT DELETE /debts/` |
| Loans | `GET POST PUT DELETE /loans/` |
| Savings | `GET POST PUT DELETE /savings/` |
| Salary Plans | `GET POST PUT DELETE /salary-plans/` |
| Gacha Banners | `GET POST PUT DELETE /gacha/banners/` |
| Banner Images | `POST DELETE /gacha/banners/{id}/images` |
| Image Upload | `POST /upload/gacha` |
| Notes | `GET POST PUT DELETE /notes/` |
| Forecast | `GET /forecast/?period=1m\|3m\|6m` |
| Calendar | `GET /calendar/{year}/{month}` |

Full docs: `http://localhost:8000/docs`

---

## Data & Privacy

- All data lives in a local SQLite file (`backend/meucaixa.db`) — gitignored
- Uploaded banner images live in `frontend/public/gacha/` — gitignored
- No accounts, no telemetry, no external services

---

## License

[MIT](LICENSE) — do whatever you want with it.
