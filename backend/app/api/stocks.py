from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, ChangeEvent
from app.providers.factory import get_market_data_provider
from app.schemas.market import StockQuote, ChartPoint, InstrumentSearch, MarketIndex
from app.schemas.change_engine import ChangeEventOut
from app.services.change_engine import change_engine
from app.providers.benchmark_provider import get_benchmark_provider

router = APIRouter(prefix="/stocks", tags=["Stocks"])

@router.get("/indices", response_model=List[MarketIndex])
async def get_market_indices():
    benchmark_provider = get_benchmark_provider()
    indices = await benchmark_provider.get_indices()
    return indices

@router.get("/search", response_model=List[InstrumentSearch])
async def search_stocks(query: str = Query(..., min_length=1)):
    provider = get_market_data_provider()
    results = await provider.search_instruments(query)
    return results

@router.get("/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    provider = get_market_data_provider()
    quote = await provider.get_quote(symbol)
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Stock symbol '{symbol}' not found.")
    return quote

@router.get("/{symbol}/history", response_model=List[ChartPoint])
async def get_stock_history(
    symbol: str,
    range: str = Query("1M", regex="^(1D|1W|1M|3M|1Y)$")
):
    provider = get_market_data_provider()
    history = await provider.get_history(symbol, range_period=range)
    return history

@router.get("/{symbol}/events", response_model=List[ChangeEventOut])
def get_stock_events(
    symbol: str,
    db: Session = Depends(get_db)
):
    events = db.query(ChangeEvent).filter(
        ChangeEvent.symbol == symbol.upper()
    ).order_by(ChangeEvent.occurred_at.desc()).limit(20).all()
    return [ChangeEventOut.model_validate(e) for e in events]
