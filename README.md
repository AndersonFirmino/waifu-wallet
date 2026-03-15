[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/AndersonFirmino/waifu-wallet?utm_source=oss&utm_medium=github&utm_campaign=AndersonFirmino%2Fwaifu-wallet&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

# 💵 Waifu Wallet

> **A financial manager built by gacha players, for gacha players.**

Calling all Travellers, Trailblazers, and Proxies — if you play **Genshin Impact**, **Honkai: Star Rail**, or **Zenless Zone Zero** (and friends), this one's for you. Track your income, expenses, debts, credit cards, and savings — all so you can confidently know *exactly* how much you can throw at the next banner without destroying your life.

Multi-game stash tracking, pull calculators, constellation and refinement targets, real-time currency conversion. Your wallet. Your waifus. Under control.

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

### 🎰 Gacha

- **Banner Tracker** — manage active and upcoming banners across all your games, with image carousel and live countdown timers
- **Pull Calculator** — per-game stash allocation with auto-calculated estimated pulls from your current currency balance
- **Pity Tracker** — constellation and refinement targeting so you always know how far you are from the guarantee
- **Multi-game Stash** — per-game currency tracking with correct labels (Primogems, Stellar Jade, Polychrome, Astrite, Pyroxene, Crystals)

### 💰 Financial

- **Dashboard** — balance overview, payday countdown, AI advisor notes, financial timeline roadmap
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

## Contributing

Want to contribute? Check out [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

---

## License

[MIT](LICENSE) — do whatever you want with it.

---

*Made with love by a waifuist, for all the fellow waifuists who play gacha out there. May your pulls be golden and your wallet survive. 💵*
