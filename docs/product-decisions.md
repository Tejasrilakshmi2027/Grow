# PulseWatch — Product Decision Document

## 1. Product Vision
**PulseWatch**: *Know what changed. Know what matters.*

Traditional stock watchlists display static grids of green and red percentage changes. When a user opens an app with 30 stocks, they are forced to scan every single symbol to deduce if anything important occurred.

PulseWatch shifts the burden from the human to the system by answering:
1. **What changed since I last checked?**
2. **Which stocks deserve my attention right now and why?**

## 2. Target User
- Active retail investors and traders monitoring 10–50+ instruments.
- Time-constrained users who log in once or twice a day and want an instant executive summary of market shifts.

## 3. Definition of "Meaningful Change" & 7-Signal Engine

A price change alone is not a meaningful change. A stock moving +1% on 3x average volume when the broader market is down -1.5% is far more meaningful than a stock moving +2% in line with a market-wide rally.

### Signal Weights Table (Exact Code Implementation)
| Signal Code | Name | Weight | Calculation / Formula |
| :--- | :--- | :--- | :--- |
| `PRICE_MOVE` | Price Movement | **25%** | Absolute % change vs previous close: `min(100.0, (abs(change_pct) / 5.0) * 80.0)` |
| `VOLUME_ANOMALY` | Volume Anomaly | **20%** | Ratio vs 20-trading-day average volume: `min(100.0, max(0.0, (vol_ratio - 1.0) * 50.0))` |
| `VOLATILITY_SHIFT` | Volatility Expansion | **15%** | Annualized volatility from daily log returns vs 15% baseline |
| `MARKET_RELATIVE` | Market Outperformance | **15%** | Outperformance vs benchmark index return (`change_pct - benchmark_return`) |
| `CORPORATE_EVENT` | Corporate Events | **15%** | Filings, earnings, dividends, splits impact score |
| `NEWS_SIGNAL` | Real-Time News | **5%** | Breaking news impact score |
| `RECENCY` | Checkpoint Decay | **5%** | Session recency decay relative to `last_checked_at` |

### Historical Volatility Calculation Formula (`VOLATILITY_SHIFT`)
To ensure financial defensibility, `volatility_20d` is computed using actual historical daily log returns:
$$\text{Log Return } r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$
$$\sigma_{\text{daily}} = \text{std}(r_{1}, r_{2}, \dots, r_{20})$$
$$\text{Annualized Volatility } \sigma_{\text{annual}} = \sigma_{\text{daily}} \times \sqrt{252}$$

Volatility expansion score is calculated against a baseline equity market volatility of 15% ($\sigma_{\text{baseline}} = 0.15$):
$$\text{Vol Raw Score} = \min\left(100, \max\left(0, (\sigma_{\text{annual}} \times 100 - 15) \times 4.0\right)\right)$$

## 4. Strict Data Provider Isolation Rules
- **Live Provider (`YahooMarketDataProvider`)**: Fetches real market data from Yahoo Finance API. NEVER falls back to demo data. If a stock quote or benchmark is unavailable, it returns explicit `None` / `is_available: false` states.
- **Demo Provider (`DemoMarketDataProvider`)**: Active ONLY when `MARKET_DATA_PROVIDER=demo`. Returns synthetic quotes and shocks explicitly tagged with `data_mode="demo"`.
- **Data Mode Propagation**: Every `StockQuote` and `FreshnessMetadata` exposes `data_mode` (`"live"` | `"demo"`). UI components display explicit badges (`LIVE` vs `DEMO / SIMULATION`).

## 5. UI/UX Principles
- **Attention Hierarchy**: High Attention stocks (Score 71–100) are highlighted at the top, followed by Medium (46–70), Low (21–45), and Normal (0–20).
- **De-emphasized Unchanged Section**: Stocks without meaningful movement are cleanly grouped under "No Meaningful Changes", saving cognitive load.
- **Transparent Explanations**: Clicking "Why this matters" reveals exact signal breakdowns rather than black-box recommendations.
- **Responsible Financial UX**: PulseWatch provides context, not buy/sell advice. No "BUY NOW" or "GUARANTEED RETURN" language.
