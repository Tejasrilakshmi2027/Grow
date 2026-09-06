from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.schemas.market import StockQuote

class SignalContribution(BaseModel):
    name: str
    code: str
    raw_value: float
    contribution: float # 0 to 100 points
    weight: float
    description: str

class ExplanationOut(BaseModel):
    summary: str
    bullets: List[str]
    confidence_score: float
    signals: List[SignalContribution]

class ChangeEventOut(BaseModel):
    id: str
    symbol: str
    watchlist_id: Optional[str] = None
    event_type: str
    occurred_at: datetime
    score: float
    severity: str # NORMAL, LOW, MEDIUM, HIGH
    headline: str
    payload: Dict[str, Any]

    class Config:
        from_attributes = True

class StockAttentionCard(BaseModel):
    symbol: str
    instrument_name: str
    exchange: str
    quote: StockQuote
    attention_score: float # 0-100
    severity: str # NORMAL, LOW, MEDIUM, HIGH
    last_checked_at: Optional[datetime] = None
    since_last_checked_text: str
    key_signals: List[str]
    explanation: ExplanationOut
    recent_events: List[ChangeEventOut] = []

class UnchangedStockCard(BaseModel):
    symbol: str
    instrument_name: str
    price: float
    change_percent: float
    volume_ratio: float
    reason: str

class DashboardOverview(BaseModel):
    watchlist_id: str
    watchlist_name: str
    user_name: str
    last_checked_at: Optional[datetime] = None
    is_first_visit: bool
    need_attention_count: int
    meaningful_changes_count: int
    unchanged_count: int
    attention_cards: List[StockAttentionCard]
    unchanged_cards: List[UnchangedStockCard]
    freshness: Dict[str, Any]
