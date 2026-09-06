import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import yfinance as yf
from app.schemas.market import MarketIndex

logger = logging.getLogger(__name__)

class BenchmarkProvider:
    """
    Provides market benchmark data (e.g., NIFTY 50) for relative performance calculations
    and market index summaries. Never fabricates values in live mode if real data is missing.
    """
    def __init__(self, use_demo: bool = True):
        self.use_demo = use_demo
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes cache

    async def get_benchmark_return(self, benchmark_symbol: str = "^NSEI") -> Optional[float]:
        """
        Get the current day's percentage return for the benchmark index.
        Returns None if real data is unavailable in live mode.
        """
        cache_key = f"{benchmark_symbol}_return"
        now = datetime.now(timezone.utc)

        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if (now - cached_time).total_seconds() < self._cache_ttl:
                return cached_data

        if self.use_demo:
            # Deterministic demo return mapping
            demo_returns = {
                "^NSEI": 0.92,
                "^GSPC": 0.40,
                "^BSESN": 0.85,
                "^NSEBANK": -0.15
            }
            res = demo_returns.get(benchmark_symbol.upper(), 0.50)
            self._cache[cache_key] = (res, now)
            return res

        # Fetch real benchmark data from Yahoo Finance in thread pool
        try:
            loop = asyncio.get_running_loop()

            def _fetch():
                t = yf.Ticker(benchmark_symbol)
                info = t.fast_info
                last_p = getattr(info, 'last_price', None)
                prev_c = getattr(info, 'previous_close', None)
                if last_p is not None and prev_c is not None and prev_c > 0:
                    return ((float(last_p) - float(prev_c)) / float(prev_c)) * 100.0
                
                # Fallback to 2-day history
                df = t.history(period="5d")
                if len(df) >= 2:
                    c_prev = float(df['Close'].iloc[-2])
                    c_last = float(df['Close'].iloc[-1])
                    if c_prev > 0:
                        return ((c_last - c_prev) / c_prev) * 100.0
                return None

            ret = await loop.run_in_executor(None, _fetch)
            if ret is not None:
                ret_rounded = round(ret, 2)
                self._cache[cache_key] = (ret_rounded, now)
                return ret_rounded
            
            logger.warning(f"Live benchmark return unavailable for {benchmark_symbol}")
            return None
        except Exception as e:
            logger.warning(f"Error fetching live benchmark return for {benchmark_symbol}: {e}")
            return None

    async def get_indices(self) -> List[MarketIndex]:
        """
        Fetch market index summaries (NIFTY 50, SENSEX, BANK NIFTY).
        In live mode: returns actual values or is_available=False if query fails.
        In demo mode: returns deterministic synthetic values with data_mode="demo".
        """
        indices_def = [
            {"symbol": "NIFTY 50", "yf_symbol": "^NSEI", "name": "NSE Benchmark", "demo_price": 23845.20, "demo_change": 0.42},
            {"symbol": "SENSEX", "yf_symbol": "^BSESN", "name": "BSE Benchmark", "demo_price": 78412.90, "demo_change": 0.68},
            {"symbol": "BANK NIFTY", "yf_symbol": "^NSEBANK", "name": "Banking Sector", "demo_price": 51210.45, "demo_change": -0.15},
        ]

        if self.use_demo:
            return [
                MarketIndex(
                    symbol=item["symbol"],
                    name=item["name"],
                    price=item["demo_price"],
                    change_percent=item["demo_change"],
                    data_mode="demo",
                    is_available=True
                ) for item in indices_def
            ]

        # Live Mode Index Retrieval
        loop = asyncio.get_running_loop()
        results: List[MarketIndex] = []

        def _fetch_all_indices():
            out = []
            for item in indices_def:
                try:
                    t = yf.Ticker(item["yf_symbol"])
                    info = t.fast_info
                    last_p = getattr(info, 'last_price', None)
                    prev_c = getattr(info, 'previous_close', None)
                    if last_p is not None and prev_c is not None and prev_c > 0:
                        lp = float(last_p)
                        pc = float(prev_c)
                        chg_pct = round(((lp - pc) / pc) * 100.0, 2)
                        out.append(MarketIndex(
                            symbol=item["symbol"],
                            name=item["name"],
                            price=round(lp, 2),
                            change_percent=chg_pct,
                            data_mode="live",
                            is_available=True
                        ))
                    else:
                        out.append(MarketIndex(
                            symbol=item["symbol"],
                            name=item["name"],
                            price=None,
                            change_percent=None,
                            data_mode="live",
                            is_available=False
                        ))
                except Exception as e:
                    logger.warning(f"Failed to fetch live index {item['symbol']}: {e}")
                    out.append(MarketIndex(
                        symbol=item["symbol"],
                        name=item["name"],
                        price=None,
                        change_percent=None,
                        data_mode="live",
                        is_available=False
                    ))
            return out

        return await loop.run_in_executor(None, _fetch_all_indices)

_benchmark_provider = None

def get_benchmark_provider() -> BenchmarkProvider:
    global _benchmark_provider
    if _benchmark_provider is None:
        from app.core.config import settings
        _benchmark_provider = BenchmarkProvider(use_demo=(settings.MARKET_DATA_PROVIDER.lower() == "demo"))
    return _benchmark_provider

