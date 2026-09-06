from typing import Protocol, List, Optional, Dict, Any
from datetime import datetime
from app.schemas.market import StockQuote, ChartPoint, InstrumentSearch

class MarketDataProvider(Protocol):
    async def get_quote(self, symbol: str) -> Optional[StockQuote]:
        """Fetch latest quote for a symbol."""
        ...

    async def get_quotes_batch(self, symbols: List[str]) -> Dict[str, StockQuote]:
        """Fetch quotes in batch for multiple symbols."""
        ...

    async def get_history(self, symbol: str, range_period: str = "1M") -> List[ChartPoint]:
        """Fetch historical candles (1D, 1W, 1M, 3M, 1Y)."""
        ...

    async def search_instruments(self, query: str) -> List[InstrumentSearch]:
        """Search instruments matching query string."""
        ...

    async def get_corporate_events(self, symbol: str) -> List[Dict[str, Any]]:
        """Fetch recent corporate filings, earnings, dividends, splits."""
        ...

    async def get_news(self, symbol: str) -> List[Dict[str, Any]]:
        """Fetch recent relevant news headlines."""
        ...
