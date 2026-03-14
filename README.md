[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/AndersonFirmino/waifu-wallet?utm_source=oss&utm_medium=github&utm_campaign=AndersonFirmino%2Fwaifu-wallet&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

# 💵 Waifu Wallet

> **A financial manager for people who LOVE gacha games and want to manage their spending the simple and easy way.**

Built by gacha players, for gacha players. Track your income, expenses, debts, credit cards, and savings — all so you can confidently know exactly how much you can throw at the next banner without destroying your life. Multi-game stash tracking, pull calculators, constellation/refinement targets, and real-time currency conversion included.

---

## Easy Setup (Windows, no dev knowledge needed)

1. **Download** — click the green **Code** button on GitHub → **Download ZIP**
2. **Extract** — right-click the ZIP → **Extract All**
3. **Setup** — double-click `setup.bat` (installs Python, Node.js and dependencies automatically)
4. If it says "close and reopen" → close the window, double-click `setup.bat` again
5. **Done!** From now on, just double-click `start.bat` to launch

> Requires Windows 10 1709+ (has `winget` built-in). If `winget` is missing, update "App Installer" from the Microsoft Store.

---

## Features

- **Dashboard** — balance overview, payday countdown, AI advisor notes, financial timeline roadmap
- **Gacha Tracker** — multi-game banner management with image carousel, live countdown, pull calculator with per-game stash allocation, constellation/refinement tracking, and auto-calculated estimated pulls
- **Transactions** — income and expense log
- **Credit Cards** — multi-card management with inline bill editing, subscriptions (BRL/USD with live exchange rate), and limit visualization
- **Fixed Expenses** — recurring monthly costs with EMA-based forecast
- **Debts & Loans** — installment tracking with urgency alerts and progress bars
- **Savings** — savings accounts with goal tracking
- **Salary Plans** — salary progression planning with split-payment support and 12-month projection
- **Forecast** — balance projection for 1 / 3 / 6 months across base, optimistic, and pessimistic scenarios
- **Financial Calendar** — monthly view with holidays (BrasilAPI), salary payment dates, automatic payment shifting on holidays/weekends, subscription billing dates, and credit card due dates
- **Notes** — markdown notes (designed for an AI advisor to leave persistent observations)

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.13+ · FastAPI · SQLAlchemy · SQLite · Ruff |
| Frontend | React 19 · TypeScript · Vite · TailwindCSS |
| Charts | Recharts |
| Backend packages | [uv](https://github.com/astral-sh/uv) |
| Frontend packages | npm |

---

## Project Structure

```
waifu-wallet/
├── .github/
│   ├── workflows/ci.yml    # CI pipeline (lint, typecheck, test, build, pytest)
│   └── dependabot.yml      # Automated dependency updates
├── setup.bat               # One-click setup (installs everything)
├── start.bat               # One-click start (backend + frontend + browser)
├── backend/
│   ├── routers/            # One file per feature module
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── database.py         # SQLite engine + session setup
│   ├── main.py             # FastAPI app, CORS, router registration
│   ├── seed.py             # Optional seed script for sample data
│   ├── tests/              # pytest test suite
│   └── pyproject.toml      # Dependencies (managed by uv)
└── frontend/
    ├── src/
    │   ├── pages/          # One file per route/screen
    │   ├── components/     # Shared UI components
    │   ├── hooks/          # useFetch and other hooks
    │   ├── lib/            # Typed API response decoders
    │   ├── utils/          # Currency and date formatters
    │   └── types/          # TypeScript domain types
    ├── public/
    │   └── gacha/          # Uploaded banner images (local only, gitignored)
    └── package.json
```

---

## Developer Setup

If you prefer manual setup over the `.bat` scripts:

### Requirements

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) — `winget install astral-sh.uv`
- Node.js 20+
- npm

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` — API requests are proxied to backend via Vite config.

### Other commands

```bash
# Backend tests
cd backend && uv run pytest

# Frontend
npm run typecheck      # TypeScript strict check
npm run lint           # ESLint
npm run test           # Vitest suite
npm run build          # Production build
```

### Seed sample data (optional)

```bash
cd backend
uv run python seed.py
```

---

## Contributing

We welcome contributions! Please follow the workflow below to keep things clean.

### Branch Strategy

We use a simplified Gitflow:

- `master` — stable releases only, tagged with versions (e.g. `v0.2.0`)
- `develop` — active development, all features merge here first
- `feat/*` — feature branches (branch from `develop`)
- `fix/*` — bug fix branches (branch from `develop`)

### How to Contribute

1. Fork the repo and clone it
2. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feat/my-feature
   ```
3. Make your changes
4. Ensure all checks pass:
   ```bash
   # Frontend
   cd frontend
   npm run lint          # ESLint — zero errors
   npm run typecheck     # TypeScript strict — zero errors
   npm run test          # Vitest suite — all green
   npm run build         # Production build — must succeed

   # Backend
   cd backend
   uv run ruff check .   # Ruff linter — zero errors
   uv run ruff format --check .  # Ruff formatter — must pass
   uv run pytest         # pytest suite — all green
   ```
5. Commit using **Gitmoji + Conventional Commits**:
   ```
   ✨ feat: add new gacha game support
   🐛 fix: calendar showing wrong salary date
   ♻️ refactor: extract pull calculator to utility
   🧪 test: add unit tests for budget analyzer
   ```
6. Push and open a PR against `develop`
7. Wait for CI and AI reviewers (Gemini Code Assist + CodeRabbit) to approve

### CI Pipeline

Every PR triggers automated checks via GitHub Actions:

| Check | Command | What it does |
|-------|---------|-------------|
| ESLint | `npm run lint` | Code style and quality |
| TypeScript | `npm run typecheck` | Type safety (strict mode) |
| Vitest | `npm run test` | Frontend unit tests |
| Build | `npm run build` | Ensures production build works |
| Ruff | `uv run ruff check .` | Python linting |
| Ruff Format | `uv run ruff format --check .` | Python formatting |
| pytest | `uv run pytest` | Backend tests |

PRs cannot be merged until all checks pass.

### Code Standards

- **All code in English** — variable names, functions, classes, comments. Only UI labels in Portuguese (pt-BR).
- **TypeScript**: strict mode, no `any`, no `as` type assertions, ESLint must pass
- **Python**: type hints on all functions, no `# type: ignore`, Ruff must pass
- **Tests required** — new features must include tests

### AI Code Review

Every PR is automatically reviewed by:
- **Gemini Code Assist** — Google's AI reviewer
- **CodeRabbit** — AI-powered code review with security and quality analysis

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
| Gacha Stashes | `GET /gacha/stashes` · `GET PATCH /gacha/stash/game?game=X` |
| Image Upload | `POST /upload/gacha` |
| Settings | `GET PATCH /settings/` |
| Notes | `GET POST PUT DELETE /notes/` |
| Forecast | `GET /forecast/?period=1m\|3m\|6m` |
| Calendar | `GET /calendar/{year}/{month}` |

Full docs: `http://localhost:8000/docs`

---

## Supported Gacha Games

| Game | Char Pity | Weapon Pity | Currency |
|------|-----------|-------------|----------|
| Genshin Impact | 90 | 80 | Primogems / Intertwined Fate |
| Honkai: Star Rail | 90 | 80 | Stellar Jade / Special Pass |
| Zenless Zone Zero | 90 | 80 | Polychrome / Encrypted Master Tape |
| Honkai Impact 3rd | 100 | 50 | Crystals / Supply Card |
| Wuthering Waves | 80 | 80 | Astrite / Radiant Tide |
| Blue Archive | 200 | — | Pyroxene / Recruitment Ticket |

Per-game stash tracking, pull calculators, and currency labels are all automatic based on which games you have banners for.

---

## TODO

- [ ] **Full responsive design** — make every page mobile-friendly so users can manage their finances from any device (phone, tablet, desktop)

---

## Data & Privacy

- All data lives in a local SQLite file (`backend/waifu_wallet.db`) — gitignored
- Uploaded banner images live in `frontend/public/gacha/` — gitignored
- No accounts, no telemetry — only external calls are BrasilAPI (holidays) and AwesomeAPI (USD/BRL exchange rate)

---

## Special Thanks

- **Aridusan** — beta tester, feedback, and tons of improvement suggestions that shaped the tool into what it is today. 🙏

---

## License

[MIT](LICENSE) — do whatever you want with it.

---

*Made with love by a waifuist, for all the fellow waifuists who play gacha out there. May your pulls be golden and your wallet survive. 💵*
