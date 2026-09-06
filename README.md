# PulseWatch — Smart Market Watchlist

> **Know what changed. Know what matters.**
> Built for the **Code by Groww 2026 Engineering Challenge**.

---

## 🏆 Product Vision & Executive Summary

Traditional stock watchlists force investors to manually scroll through lists of symbols, inspect individual charts, and compute relative performance in their heads just to figure out what happened while they were away.

**PulseWatch solves the fundamental question:**
> *"What changed since I last checked, and why does it matter right now?"*

Instead of presenting an overwhelming table of raw numbers, **PulseWatch** functions as an **intelligent market radar**:
1. **Remembers your checkpoint** — Tracks the exact timestamp when you last viewed your watchlist.
2. **Calculates 7-Signal Attention Scores (0–100)** — Evaluates Price Movement, Volume Anomalies, Volatility Shifts, Market Outperformance, Corporate Filings, News, and Recency.
3. **Surfaces What Matters First** — Ranks stocks by relative urgency, separating actionable anomalies from normal baseline market noise.
4. **Transparent Explainability** — Every score comes with a deterministic breakdown explaining *why* it moved.

---

## 🔒 Strict Live vs. Demo Data Architecture

PulseWatch adheres strictly to financial data integrity standards:
* **Live Market Provider (`YahooMarketDataProvider`)**: Fetches real-time price quotes, volume ratios, and historical OHLC data via Yahoo Finance. Missing signal fields (e.g. corporate filings) are transparently omitted without fabricating fake headlines.
* **Demo Simulation Provider (`DemoMarketDataProvider`)**: Used in offline/evaluator mode to inject controlled market shocks (earnings surprises, volume jumps) for deterministic verification.
* **Data Freshness Transparency**: Every quote and card displays a prominent badge (`LIVE DATA` or `DEMO SIMULATION`) and source timestamp (`Updated XXs ago`).

---

## 📐 Deterministic 7-Signal Attention Engine

| Signal Code | Signal Name | Weight | Scoring Logic |
| :--- | :--- | :--- | :--- |
| `PRICE_MOVE` | Price Movement | **25%** | Absolute % change relative to last close baseline |
| `VOLUME_ANOMALY` | Volume Anomaly | **20%** | Ratio vs 20-day average volume (e.g. 2.4x) |
| `VOLATILITY_SHIFT` | Volatility Expansion | **15%** | 20-day annualized volatility from daily log returns vs 15% baseline |
| `MARKET_RELATIVE` | Market Outperformance | **15%** | Delta vs market benchmark return (^NSEI) |
| `CORPORATE_EVENT` | Corporate Filings | **15%** | Impact weighting for corporate filings and announcements |
| `NEWS_SIGNAL` | Real-Time News | **5%** | Verified sentiment or breaking news trigger |
| `RECENCY` | Checkpoint Decay | **5%** | Linear score decay relative to user's `last_checked_at` |

---

## 🛠 Tech Stack

* **Backend**: FastAPI (Python 3.11), SQLAlchemy 2.0, Pydantic V2, SQLite / PostgreSQL.
* **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Lucide Icons.
* **Testing**: Pytest, Asyncio, E2E HTTP verification suite.

---

## ⚡ Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix:
source venv/bin/activate

pip install -r requirements.txt
python app/seed_demo.py
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will run at `http://127.0.0.1:3000`.

---

## 🧪 Verification & Test Suite

Run the full automated backend test suite:
```bash
cd backend
python -m pytest tests -v
```

Run end-to-end flow verification (Auth → Checkpoint → Shock Injection → Re-ranking):
```bash
python tmp/e2e_verify.py
```

---

## 🔑 Hackathon Judge Evaluation Credentials

* **Demo Account Email**: `demo@pulsewatch.app`
* **Demo Account Password**: `groww2026`
* **Demo Lab**: Click **"⚡ Demo Lab"** in the top navigation bar to inject live market shocks (`RELIANCE +5.2% Surge`, `TATAMOTORS Volume Jump`) and evaluate immediate dashboard re-ranking.
