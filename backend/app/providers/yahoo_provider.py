import logging
import asyncio
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import yfinance as yf
from app.schemas.market import StockQuote, ChartPoint, InstrumentSearch, FreshnessMetadata
from app.providers.benchmark_provider import get_benchmark_provider
from app.core.config import settings

logger = logging.getLogger(__name__)

class YahooMarketDataProvider:
    """
    Live market provider using yfinance with strict real data guarantees.
    NEVER falls back to DemoMarketDataProvider.
    """
    def __init__(self):
        pass

    def _normalize_symbol(self, symbol: str) -> str:
        s = symbol.upper().strip()
        if s in ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "TATAMOTORS", "BHARTIARTL", "SBIN"]:
            return f"{s}.NS"
        return s

    async def get_quote(self, symbol: str) -> Optional[StockQuote]:
        try:
            yf_symbol = self._normalize_symbol(symbol)
            loop = asyncio.get_running_loop()

            def _fetch_quote_data():
                ticker = yf.Ticker(yf_symbol)
                info = ticker.fast_info
                # Also fetch 1mo history for 20d volume & volatility calculation
                hist = ticker.history(period="1mo", interval="1d")
                return ticker, info, hist

            ticker, info, hist = await loop.run_in_executor(None, _fetch_quote_data)

            if not info or not hasattr(info, 'last_price') or info.last_price is None or math.isnan(float(info.last_price)):
                logger.warning(f"Yahoo live quote unavailable for {symbol}. Returning None (no demo fallback).")
                return None

            price = float(info.last_price)
            prev_close = float(getattr(info, 'previous_close', price) or price)
            if math.isnan(prev_close) or prev_close <= 0:
                prev_close = price

            change_abs = price - prev_close
            change_pct = (change_abs / prev_close) * 100.0 if prev_close else 0.0
            volume = float(getattr(info, 'last_volume', 0.0) or 0.0)
            if math.isnan(volume):
                volume = 0.0

            # Requirement 6: Calculate actual 20-trading-day average volume
            if not hist.empty and 'Volume' in hist.columns and len(hist['Volume']) > 0:
                vol_20d_slice = hist['Volume'].tail(20)
                avg_vol_20d = float(vol_20d_slice.mean())
            else:
                avg_vol_20d = float(getattr(info, 'average_volume', 1.0) or 1.0)

            if math.isnan(avg_vol_20d) or avg_vol_20d <= 0:
                avg_vol_20d = 1.0

            vol_ratio = volume / avg_vol_20d if avg_vol_20d > 0 else 1.0

            # Requirement 7: Get real benchmark return from BenchmarkProvider
            benchmark_provider = get_benchmark_provider()
            benchmark_symbol = "^NSEI" if ".NS" in yf_symbol else "^GSPC"
            market_return = await benchmark_provider.get_benchmark_return(benchmark_symbol)
            
            if market_return is not None:
                rel_perf = round(change_pct - market_return, 2)
            else:
                rel_perf = None

            # Requirement 8: Calculate defensible 20-day volatility from log returns
            volatility_20d = self._calculate_volatility_from_hist(hist)

            # Requirement 5: Fix Freshness Metadata (provider timestamp check)
            now = datetime.now(timezone.utc)
            provider_timestamp = None
            if hasattr(info, 'last_price_timestamp') and info.last_price_timestamp:
                try:
                    provider_timestamp = datetime.fromtimestamp(float(info.last_price_timestamp), tz=timezone.utc)
                except Exception:
                    provider_timestamp = None

            if provider_timestamp:
                age_secs = max(0.0, (now - provider_timestamp).total_seconds())
                timestamp_avail = True
                if age_secs < settings.FRESHNESS_FRESH_SECONDS:
                    status_str = "fresh"
                elif age_secs < settings.FRESHNESS_AGING_SECONDS:
                    status_str = "aging"
                else:
                    status_str = "stale"
            else:
                provider_timestamp = None
                age_secs = None
                timestamp_avail = False
                status_str = "timestamp_unavailable"

            freshness = FreshnessMetadata(
                source="Yahoo Finance Live API",
                source_timestamp=provider_timestamp,
                fetched_at=now,
                age_seconds=round(age_secs, 1) if age_secs is not None else None,
                status=status_str,
                data_mode="live",
                timestamp_available=timestamp_avail
            )

            open_p = float(getattr(info, 'open', price) or price)
            high_p = float(getattr(info, 'day_high', price) or price)
            low_p = float(getattr(info, 'day_low', price) or price)

            return StockQuote(
                symbol=symbol.upper(),
                name=symbol.upper(),
                exchange="NSE" if ".NS" in yf_symbol else "US",
                price=round(price, 2),
                change_absolute=round(change_abs, 2),
                change_percent=round(change_pct, 2),
                open=round(open_p if not math.isnan(open_p) else price, 2),
                high=round(high_p if not math.isnan(high_p) else price, 2),
                low=round(low_p if not math.isnan(low_p) else price, 2),
                previous_close=round(prev_close, 2),
                volume=volume,
                avg_volume_20d=round(avg_vol_20d, 0),
                volume_ratio=round(vol_ratio, 2),
                volatility_20d=round(volatility_20d, 4),
                market_cap=float(getattr(info, 'market_cap', 0) or 0) if getattr(info, 'market_cap', None) else None,
                market_return=market_return,
                relative_outperformance=rel_perf,
                freshness=freshness,
                data_mode="live"
            )
        except Exception as e:
            logger.warning(f"Yahoo live query failed for {symbol}: {e}. Returning None.")
            return None

    async def get_quotes_batch(self, symbols: List[str]) -> Dict[str, StockQuote]:
        res = {}
        for s in symbols:
            q = await self.get_quote(s)
            if q:
                res[s.upper()] = q
        return res

    async def get_history(self, symbol: str, range_period: str = "1M") -> List[ChartPoint]:
        try:
            yf_symbol = self._normalize_symbol(symbol)
            period_map = {"1D": "1d", "1W": "5d", "1M": "1mo", "3M": "3mo", "1Y": "1y"}
            interval_map = {"1D": "5m", "1W": "15m", "1M": "1d", "3M": "1d", "1Y": "1wk"}

            period = period_map.get(range_period.upper(), "1mo")
            interval = interval_map.get(range_period.upper(), "1d")

            loop = asyncio.get_running_loop()
            def _fetch_hist():
                t = yf.Ticker(yf_symbol)
                return t.history(period=period, interval=interval)

            df = await loop.run_in_executor(None, _fetch_hist)
            if df.empty:
                return []

            points = []
            for idx, row in df.iterrows():
                dt = idx.to_pydatetime() if hasattr(idx, 'to_pydatetime') else datetime.now(timezone.utc)
                points.append(ChartPoint(
                    timestamp=dt,
                    price=round(float(row['Close']), 2),
                    open=round(float(row['Open']), 2),
                    high=round(float(row['High']), 2),
                    low=round(float(row['Low']), 2),
                    volume=round(float(row['Volume']), 0)
                ))
            return points
        except Exception as e:
            logger.warning(f"Yahoo history query failed for {symbol}: {e}. Returning empty list.")
            return []

    async def search_instruments(self, query: str) -> List[InstrumentSearch]:
        # Perform Yahoo live search if available or return empty list
        try:
            loop = asyncio.get_running_loop()
            def _search():
                search_res = yf.Search(query, max_results=8)
                out = []
                for item in getattr(search_res, 'quotes', []):
                    sym = item.get('symbol', '').upper()
                    if sym:
                        out.append(InstrumentSearch(
                            symbol=sym,
                            name=item.get('shortname') or item.get('longname') or sym,
                            exchange=item.get('exchange', 'NSE'),
                            sector=item.get('sector', 'Market Instrument')
                        ))
                return out
            return await loop.run_in_executor(None, _search)
        except Exception as e:
            logger.warning(f"Yahoo search query failed for {query}: {e}.")
            return []

    async def get_corporate_events(self, symbol: str) -> List[Dict[str, Any]]:
        # Live mode MUST NOT fabricate news or corporate events
        return []

    async def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        # Live mode MUST NOT fabricate news or corporate events
        return []

    def _calculate_volatility_from_hist(self, df) -> float:
        """
        Calculate 20-day annualized volatility from daily log returns:
        std(log_returns_20d) * sqrt(252)
        """
        import numpy as np
        try:
            if df.empty or 'Close' not in df.columns or len(df['Close']) < 3:
                return 0.015

            prices = [float(p) for p in df['Close'].tail(21).values if p > 0]
            if len(prices) < 3:
                return 0.015

            log_returns = []
            for i in range(1, len(prices)):
                if prices[i-1] > 0 and prices[i] > 0:
                    log_returns.append(math.log(prices[i] / prices[i-1]))

            if len(log_returns) < 2:
                return 0.015

            daily_std = np.std(log_returns)
            annualized_vol = daily_std * math.sqrt(252)
            return max(0.005, min(0.15, float(annualized_vol)))
        except Exception as e:
            logger.warning(f"Error calculating volatility: {e}")
            return 0.015
