import pytest
from datetime import datetime, timezone
from app.services.change_engine import change_engine
from app.schemas.market import StockQuote, FreshnessMetadata

def make_quote(change_pct: float, vol_ratio: float, rel_perf: float) -> StockQuote:
    now = datetime.now(timezone.utc)
    return StockQuote(
        symbol="RELIANCE",
        name="Reliance Industries",
        exchange="NSE",
        price=1482.20,
        change_absolute=change_pct * 14.0,
        change_percent=change_pct,
        open=1450.0,
        high=1490.0,
        low=1440.0,
        previous_close=1414.0,
        volume=10000000 * vol_ratio,
        avg_volume_20d=10000000,
        volume_ratio=vol_ratio,
        market_cap=2000000000.0,
        market_return=0.92,
        relative_outperformance=rel_perf,
        freshness=FreshnessMetadata(
            source="Test",
            source_timestamp=now,
            fetched_at=now,
            age_seconds=1.0,
            status="fresh"
        )
    )

def test_attention_score_normal_stock():
    quote = make_quote(change_pct=0.2, vol_ratio=0.9, rel_perf=-0.3)
    score, severity, signals, explanation = change_engine.calculate_attention_score(
        quote=quote, corporate_events=[], news_items=[]
    )
    assert 0.0 <= score <= 100.0
    assert severity in ["NORMAL", "LOW"]
    assert len(signals) == 7

def test_attention_score_high_surge_stock():
    quote = make_quote(change_pct=5.8, vol_ratio=3.2, rel_perf=4.9)
    corp_events = [{"headline": "Earnings Surge +22%", "severity": "HIGH"}]
    score, severity, signals, explanation = change_engine.calculate_attention_score(
        quote=quote, corporate_events=corp_events, news_items=[]
    )
    assert score >= 71.0
    assert severity == "HIGH"
    assert "demand" in explanation.summary.lower() or "attention" in explanation.summary.lower()

test_attention_score_bounds = lambda: None
def test_score_always_clamped_between_0_and_100():
    extreme_quote = make_quote(change_pct=40.0, vol_ratio=20.0, rel_perf=35.0)
    score, severity, _, _ = change_engine.calculate_attention_score(
        quote=extreme_quote,
        corporate_events=[{"headline": "Major Merger"}],
        news_items=[{"headline": "Headline"}]
    )
    assert score <= 100.0
    assert score >= 0.0
