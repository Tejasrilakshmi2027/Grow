from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class WatchlistItemCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    instrument_name: str = Field(..., min_length=1, max_length=100)
    exchange: str = "NSE"

class WatchlistItemOut(BaseModel):
    id: str
    watchlist_id: str
    symbol: str
    instrument_name: str
    exchange: str
    created_at: datetime

    class Config:
        from_attributes = True

class WatchlistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class WatchlistUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class WatchlistOut(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime
    items: List[WatchlistItemOut] = []

    class Config:
        from_attributes = True
