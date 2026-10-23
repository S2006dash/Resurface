# Artha — All your money, one clear picture. Private by design.

> Built for **Hacktoberfest Hack Day Chennai × CodeYGen**  
> FinTech Problem 02 — From Disconnected Financial Data to Personalized Financial Well-Being  
> Target prizes: **Best Use of Gemma 4** · **Best Open-Source AI Project**

---

## What it does

Artha reads your messy money files (UPI screenshots, bank PDFs, card bills, insurance photos),
shows every rupee in one place, and helps you reach goals — privately, on open models.

| Challenge | Artha's answer | What you see |
|-----------|---------------|--------------|
| Fragmented data across platforms | Upload a screenshot, PDF, or SMS — Gemma 4 reads it | Five files become one ledger |
| No unified insights | Net worth, cash flow, findings with proof rows | Tap any number → see the exact rows |
| Hard to plan goals | Monte Carlo goal simulator with what-if slider | "Cut food delivery → odds jump 15%" |

## Tech stack

- **Backend:** Python · Flask · PostgreSQL · pandas · gunicorn
- **AI:** Gemma 4 via Gemini API (cloud) or Ollama (local / private mode)
- **Frontend:** React 18 · Vite · Recharts
- **Deployment:** DigitalOcean App Platform · Managed PostgreSQL
- **Licence:** Apache-2.0

## Quick start (Docker)

```bash
git clone https://github.com/your-org/artha.git
cd artha
cp .env.example .env       # fill in GEMINI_API_KEY and SECRET_KEY
docker compose up --build  # starts Postgres + Flask + React
# open http://localhost:8080
```

First-time setup (creates tables + seeds demo persona):
```bash
docker compose exec app python setup_database.py
```

Demo login: **priya@demo.artha** / **demo1234** — all data is fictional.

## Local dev (no Docker)

```bash
# Backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env    # edit DATABASE_URL, SECRET_KEY, GEMINI_API_KEY
python setup_database.py
python app.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

## Private mode (offline)

Set `LLM_PROVIDER=ollama` in `.env` and run:
```bash
ollama pull gemma4:e4b
ollama serve
```
Your files never leave your laptop.

## Project structure

```
artha/
├── app.py                 # Flask app factory
├── db.py                  # DB connection helper
├── auth_utils.py          # Login decorator
├── ai_utils.py            # z-score anomaly + balance forecast
├── ingest/                # Gemma 4 reader, masking, checks  (Role A)
├── engine/                # Money engine: net worth, finders, goals  (Role B)
├── mcp/                   # Read-only MCP plug (4 tools)  (P2)
├── frontend/src/          # React SPA  (Role C)
├── routes/                # SecureBank routes (auth, dashboard, transfer, history, profile)
├── database_schema.sql    # SecureBank tables (has DROP TABLE — don't re-run on live data)
├── artha_schema.sql       # Artha tables (CREATE IF NOT EXISTS — safe to re-run)
├── setup_database.py      # Init + seed demo persona
├── docs/contract.md       # API contract everyone builds against
├── Dockerfile
└── docker-compose.yml
```

## The six planted findings (demo persona Priya)

| # | Finding | Detected by |
|---|---------|-------------|
| 1 | Three forgotten subscriptions (gym she never uses) | Recurring-payment finder |
| 2 | Food delivery spend doubled over 2 months | Spike finder |
| 3 | One duplicate charge on the same day | Duplicate finder |
| 4 | Health insurance renews in 18 days | Bills-due finder |
| 5 | Credit card close to its limit | Card-limit finder |
| 6 | Laptop goal Rs 60,000 in 6 months, only partly on track | Goal simulator |

## Measurements (fill in real numbers on the day)

| Measure | Result |
|---------|--------|
| Reading accuracy (30 files) | x% |
| Categorising accuracy (150 labelled txns) | x% |
| Planted findings found | x of 6 |
| Planted errors caught by checks | x of 5 |
| Local vs cloud accuracy gap | x% |

## Limitations

- Goal odds are Monte Carlo estimates from a short history — not financial advice.
- Categoriser makes errors on unfamiliar merchants.
- No real bank connection; all demo data is made up.
- Not financial advice. An on-screen note is shown throughout.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Apache-2.0 — matches Gemma's licence.
