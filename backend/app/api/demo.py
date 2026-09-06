from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.providers.factory import get_market_data_provider
from app.providers.demo_provider import DemoMarketDataProvider
from datetime import datetime, timezone
from app.models import ChangeEvent
from app.services.change_engine import change_engine

router = APIRouter(prefix="/demo", tags=["Demo Controller"])

class ShockTriggerRequest(BaseModel):
    symbol: str = Field(..., example="RELIANCE")
    price_change_pct: float = Field(..., example=4.82)
    volume_mult: float = Field(..., example=2.8)
    headline: Optional[str] = Field("Unusual Surge: +4.82% price spike detected with 2.8x volume", example="Unusual Surge")

@router.post("/trigger-shock")
async def trigger_demo_shock(
    req: ShockTriggerRequest,
    db: Session = Depends(get_db)
):
    provider = get_market_data_provider()
    if isinstance(provider, DemoMarketDataProvider):
        provider.inject_demo_shock(
            symbol=req.symbol,
            price_change_pct=req.price_change_pct,
            volume_mult=req.volume_mult,
            event_headline=req.headline
        )

        # Retrieve quote and calculate attention score via ChangeDetectionEngine
        q = await provider.get_quote(req.symbol)
        score = 85.0
        severity = "HIGH"
        if q:
            score, severity, _, _ = change_engine.calculate_attention_score(
                quote=q,
                corporate_events=[{"headline": req.headline or "Demo Shock Injected"}],
                news_items=[]
            )

        # Log change event in DB
        evt = ChangeEvent(
            symbol=req.symbol.upper(),
            event_type="DEMO_SHOCK",
            occurred_at=datetime.now(timezone.utc),
            score=score,
            severity=severity,
            headline=req.headline or "Demo Shock Injected",
            payload={
                "price_change_pct": req.price_change_pct,
                "volume_mult": req.volume_mult,
                "triggered_by": "evaluator_demo",
                "data_mode": "demo"
            }
        )
        db.add(evt)
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully injected market shock for {req.symbol.upper()}",
            "details": {
                "price_change_pct": req.price_change_pct,
                "volume_mult": req.volume_mult,
                "headline": req.headline,
                "calculated_score": score,
                "severity": severity
            }
        }
    else:
        raise HTTPException(status_code=400, detail="Demo shock controller is only active when MARKET_DATA_PROVIDER=demo.")
