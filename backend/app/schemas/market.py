from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class FreshnessMetadata(BaseModel):
    source: str
    source_timestamp: Optional[datetime] = None
    fetched_at: datetime
    age_seconds: Optional[float] = None
    status: str # fresh, aging, stale, timestamp_unavailable
    data_mode: str = "demo" # "live" | "demo"
    timestamp_available: bool = True

class StockQuote(BaseModel):
    symbol: str
    name: str
    exchange: str
    price: float
    change_absolute: float
    change_percent: float
    open: float
    high: float
    low: float
    previous_close: float
    volume: float
    avg_volume_20d: float
    volume_ratio: float
    volatility_20d: float = 0.015
    market_cap: Optional[float] = None
    market_return: Optional[float] = 0.0
    relative_outperformance: Optional[float] = 0.0
    freshness: FreshnessMetadata
    data_mode: str = "demo"

class ChartPoint(BaseModel):
    timestamp: datetime
    price: float
    open: float
    high: float
    low: float
    volume: float

class StockHistory(BaseModel):
    symbol: str
    range: str
    points: List[ChartPoint]

class InstrumentSearch(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: str

class MarketIndex(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    change_percent: Optional[float] = None
    data_mode: str = "demo"
    is_available: bool = True

