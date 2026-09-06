import random
import math
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from app.schemas.market import StockQuote, ChartPoint, InstrumentSearch, FreshnessMetadata
from app.core.config import settings
from app.providers.benchmark_provider import get_benchmark_provider

DEMO_INSTRUMENTS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "exchange": "NSE", "sector": "Energy & Conglomerate", "base_price": 1482.20, "prev_close": 1414.00, "avg_vol": 10000000, "vol_mult": 2.4, "nifty_return": 0.92, "event": "[DEMO EVENT] Quarterly Earnings Beat (+14% YoY Profit)", "news": "[DEMO NEWS] Reliance Retail expands quick commerce footprint across 50 cities."},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "exchange": "NSE", "sector": "Information Technology", "base_price": 3842.50, "prev_close": 3886.00, "avg_vol": 4200000, "vol_mult": 0.95, "nifty_return": 0.92, "event": None, "news": "[DEMO NEWS] TCS secures $450M multi-year cloud transformation deal with European bank."},
    {"symbol": "INFY", "name": "Infosys Limited", "exchange": "NSE", "sector": "Information Technology", "base_price": 1724.20, "prev_close": 1710.00, "avg_vol": 6500000, "vol_mult": 1.1, "nifty_return": 0.92, "event": "[DEMO EVENT] Dividend Announcement (₹18/share)", "news": "[DEMO NEWS] Infosys launches enterprise generative AI platform module."},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Limited", "exchange": "NSE", "sector": "Financial Services", "base_price": 1645.80, "prev_close": 1650.00, "avg_vol": 12000000, "vol_mult": 1.05, "nifty_return": 0.92, "event": None, "news": "[DEMO NEWS] RBI clears HDFC Bank expansion in tier-2 market centers."},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Limited", "exchange": "NSE", "sector": "Financial Services", "base_price": 1210.40, "prev_close": 1175.00, "avg_vol": 9500000, "vol_mult": 1.85, "nifty_return": 0.92, "event": "[DEMO EVENT] Board Approval for Infra Bond Issue", "news": "[DEMO NEWS] ICICI Bank reports net interest margin expansion in Q2."},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd.", "exchange": "NSE", "sector": "Automotive", "base_price": 985.30, "prev_close": 940.00, "avg_vol": 15000000, "vol_mult": 3.1, "nifty_return": 0.92, "event": "[DEMO EVENT] JLR Global Wholesale Volume Up +18%", "news": "[DEMO NEWS] Tata Motors EV division achieves milestone of 150k vehicle sales."},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Limited", "exchange": "NSE", "sector": "Telecommunications", "base_price": 1590.10, "prev_close": 1585.00, "avg_vol": 5100000, "vol_mult": 0.9, "nifty_return": 0.92, "event": None, "news": "[DEMO NEWS] Airtel rolls out standalone 5G network upgrades in key metro circles."},
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "sector": "Consumer Electronics", "base_price": 224.50, "prev_close": 218.00, "avg_vol": 48000000, "vol_mult": 2.2, "nifty_return": 0.40, "event": "[DEMO EVENT] Product Event Announcement", "news": "[DEMO NEWS] Apple unveils new AI silicon architecture at developers summit."},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "sector": "Semiconductors", "base_price": 128.40, "prev_close": 119.50, "avg_vol": 65000000, "vol_mult": 2.8, "nifty_return": 0.40, "event": "[DEMO EVENT] Record Blackwell Chip Demand Update", "news": "[DEMO NEWS] NVIDIA announces major data center architecture partnerships."},
    {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ", "sector": "Automotive & Energy", "base_price": 214.20, "prev_close": 222.00, "avg_vol": 55000000, "vol_mult": 1.4, "nifty_return": 0.40, "event": None, "news": "[DEMO NEWS] Tesla expands supercharger network access to third-party fleets."}
]

class DemoMarketDataProvider:
    """High-fidelity demo provider ensuring deterministic and predictable test changes."""
    def __init__(self):
        self._custom_shocks = {} # Used for demo market shock triggers

    def inject_demo_shock(self, symbol: str, price_change_pct: float, volume_mult: float, event_headline: Optional[str] = None):
        """Allows testing market events dynamically during evaluation."""
        self._custom_shocks[symbol] = {
            "price_change_pct": price_change_pct,
            "volume_mult": volume_mult,
            "event": f"[DEMO SIMULATION] {event_headline}" if event_headline and not event_headline.startswith("[DEMO") else event_headline
        }

    async def get_quote(self, symbol: str) -> Optional[StockQuote]:
        sym = symbol.upper()
        inst = next((item for item in DEMO_INSTRUMENTS if item["symbol"] == sym), None)
        if not inst:
            # Fallback for unrecognized test symbols
            inst = {
                "symbol": sym, "name": f"{sym} Corporation", "exchange": "NSE", "sector": "General",
                "base_price": 500.00, "prev_close": 495.00, "avg_vol": 1000000, "vol_mult": 1.0,
                "nifty_return": 0.5, "event": None, "news": f"[DEMO NEWS] Operational update for {sym}."
            }

        prev = inst["prev_close"]
        price = inst["base_price"]
        vol_mult = inst["vol_mult"]
        event = inst["event"]

        if sym in self._custom_shocks:
            shock = self._custom_shocks[sym]
            price = prev * (1 + shock["price_change_pct"] / 100.0)
            vol_mult = shock["volume_mult"]
            if shock["event"]:
                event = shock["event"]

        change_abs = price - prev
        change_pct = (change_abs / prev) * 100.0
        avg_vol = inst["avg_vol"]
        curr_vol = avg_vol * vol_mult
        
        # Get real benchmark return from BenchmarkProvider
        benchmark_provider = get_benchmark_provider()
        nifty_ret = await benchmark_provider.get_benchmark_return()
        rel_perf = change_pct - nifty_ret

        # Calculate real volatility using log returns from simulated history
        volatility_20d = self._calculate_volatility(symbol, prev, price)

        now = datetime.now(timezone.utc)
        freshness = FreshnessMetadata(
            source="Demo Simulation Feed",
            source_timestamp=now,
            fetched_at=now,
            age_seconds=0.5,
            status="fresh",
            data_mode="demo"
        )

        return StockQuote(
            symbol=sym,
            name=inst["name"],
            exchange=inst["exchange"],
            price=round(price, 2),
            change_absolute=round(change_abs, 2),
            change_percent=round(change_pct, 2),
            open=round(prev * 1.002, 2),
            high=round(max(price, prev) * 1.01, 2),
            low=round(min(price, prev) * 0.99, 2),
            previous_close=round(prev, 2),
            volume=curr_vol,
            avg_volume_20d=avg_vol,
            volume_ratio=round(vol_mult, 2),
            volatility_20d=round(volatility_20d, 4),
            market_cap=round(price * 100000000, 2),
            market_return=nifty_ret,
            relative_outperformance=round(rel_perf, 2),
            freshness=freshness,
            data_mode="demo"
        )

    def _calculate_volatility(self, symbol: str, prev_close: float, current_price: float) -> float:
        """Calculate 20-day volatility using log returns and standard deviation."""
        import numpy as np
        
        # Generate 20 days of price history for volatility calculation
        seed_val = sum(ord(c) for c in symbol)
        rng = random.Random(seed_val)
        
        prices = []
        curr_p = prev_close
        
        # Generate 20 days of prices ending at current price
        for i in range(20):
            delta = (rng.random() - 0.48) * 0.02 * curr_p
            curr_p = max(1.0, curr_p + delta)
            if i == 19:
                curr_p = current_price
            prices.append(curr_p)
        
        # Calculate log returns
        log_returns = []
        for i in range(1, len(prices)):
            log_return = math.log(prices[i] / prices[i-1])
            log_returns.append(log_return)
        
        # Calculate standard deviation of log returns (daily volatility)
        if len(log_returns) < 2:
            return 0.015  # Default fallback
        
        daily_vol = np.std(log_returns)
        
        # Annualize to get 20-day volatility (approximate for demo)
        # For 20-day period: daily_vol * sqrt(20)
        volatility_20d = daily_vol * math.sqrt(20)
        
        return max(0.005, min(0.08, volatility_20d))  # Clamp between 0.5% and 8%

    async def get_quotes_batch(self, symbols: List[str]) -> Dict[str, StockQuote]:
        res = {}
        for s in symbols:
            q = await self.get_quote(s)
            if q:
                res[s.upper()] = q
        return res

    async def get_history(self, symbol: str, range_period: str = "1M") -> List[ChartPoint]:
        q = await self.get_quote(symbol)
        if not q:
            return []

        points_count = {"1D": 78, "1W": 35, "1M": 30, "3M": 90, "1Y": 252}.get(range_period.upper(), 30)
        interval_hours = {"1D": 0.1, "1W": 4.0, "1M": 24.0, "3M": 24.0, "1Y": 24.0}.get(range_period.upper(), 24.0)

        now = datetime.now(timezone.utc)
        history = []
        curr_p = q.previous_close

        seed_val = sum(ord(c) for c in symbol)
        rng = random.Random(seed_val)

        for i in range(points_count, -1, -1):
            ts = now - timedelta(hours=i * interval_hours)
            delta = (rng.random() - 0.48) * 0.02 * curr_p
            curr_p = max(1.0, curr_p + delta)

            if i == 0:
                curr_p = q.price

            open_p = curr_p * (1 - (rng.random() - 0.5) * 0.005)
            high_p = max(open_p, curr_p) * (1 + rng.random() * 0.005)
            low_p = min(open_p, curr_p) * (1 - rng.random() * 0.005)
            vol = q.avg_volume_20d * (0.8 + rng.random() * 0.5)

            history.append(ChartPoint(
                timestamp=ts,
                price=round(curr_p, 2),
                open=round(open_p, 2),
                high=round(high_p, 2),
                low=round(low_p, 2),
                volume=round(vol, 0)
            ))
        return history

    async def search_instruments(self, query: str) -> List[InstrumentSearch]:
        q = query.lower().strip()
        matches = []
        for inst in DEMO_INSTRUMENTS:
            if q in inst["symbol"].lower() or q in inst["name"].lower() or q in inst["sector"].lower():
                matches.append(InstrumentSearch(
                    symbol=inst["symbol"],
                    name=inst["name"],
                    exchange=inst["exchange"],
                    sector=inst["sector"]
                ))
        return matches

    async def get_corporate_events(self, symbol: str) -> List[Dict[str, Any]]:
        sym = symbol.upper()
        inst = next((item for item in DEMO_INSTRUMENTS if item["symbol"] == sym), None)
        events = []

        now = datetime.now(timezone.utc)
        if inst and inst["event"]:
            events.append({
                "type": "DEMO_EVENT",
                "headline": inst["event"],
                "occurred_at": now - timedelta(hours=2, minutes=15),
                "severity": "HIGH",
                "source": "Demo Simulation Engine"
            })

        if sym in self._custom_shocks and self._custom_shocks[sym].get("event"):
            events.append({
                "type": "SIMULATION_SHOCK",
                "headline": self._custom_shocks[sym]["event"],
                "occurred_at": now - timedelta(minutes=10),
                "severity": "HIGH",
                "source": "Evaluator Lab Simulation"
            })
        return events

    async def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        sym = symbol.upper()
        inst = next((item for item in DEMO_INSTRUMENTS if item["symbol"] == sym), None)
        now = datetime.now(timezone.utc)
        if inst and inst["news"]:
            return [{
                "headline": inst["news"],
                "source": "Demo Simulation Feed",
                "published_at": now - timedelta(hours=4),
                "url": f"https://demo.pulsewatch.app/news/{sym.lower()}",
                "relevance": 0.95
            }]
        return []
