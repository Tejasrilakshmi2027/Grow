import asyncio
import pytest
from app.providers.demo_provider import DemoMarketDataProvider
from app.providers.yahoo_provider import YahooMarketDataProvider
from app.services.change_engine import change_engine
from datetime import datetime, timezone, timedelta

def test_demo_provider_data_mode():
    async def _test():
        provider = DemoMarketDataProvider()
        quote = await provider.get_quote("RELIANCE")
        assert quote is not None
        assert quote.freshness.data_mode == "demo"
        assert quote.data_mode == "demo"
    asyncio.run(_test())

def test_same_change_engine_processes_both_providers():
    async def _test():
        demo_provider = DemoMarketDataProvider()
        yahoo_provider = YahooMarketDataProvider()

        quote_demo = await demo_provider.get_quote("RELIANCE")
        quote_yahoo = await yahoo_provider.get_quote("RELIANCE")

        checkpoint = datetime.now(timezone.utc) - timedelta(hours=2)

        # Process demo quote through change detection engine
        score_demo, sev_demo, sigs_demo, exp_demo = change_engine.calculate_attention_score(
            quote_demo,
            [],
            [],
            checkpoint
        )

        # Process yahoo quote through exact same change detection engine
        score_yahoo, sev_yahoo, sigs_yahoo, exp_yahoo = change_engine.calculate_attention_score(
            quote_yahoo,
            [],
            [],
            checkpoint
        )

        assert 0 <= score_demo <= 100
        assert 0 <= score_yahoo <= 100
        assert exp_demo.summary is not None
        assert exp_yahoo.summary is not None
    asyncio.run(_test())

def test_duplicate_stock_returns_409(client, auth_headers):
    # 1. Get watchlists
    res = client.get("/api/watchlists", headers=auth_headers)
    wl_id = res.json()[0]["id"]

    # 2. Add TATAMOTORS
    res1 = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "TATAMOTORS",
        "instrument_name": "Tata Motors Ltd.",
        "exchange": "NSE"
    }, headers=auth_headers)
    assert res1.status_code in [201, 409]

    # 3. Add duplicate TATAMOTORS -> Must return 409 Conflict
    res2 = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "TATAMOTORS",
        "instrument_name": "Tata Motors Ltd.",
        "exchange": "NSE"
    }, headers=auth_headers)
    assert res2.status_code == 409
    assert "already in this watchlist" in res2.json()["detail"]

def test_api_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "backend" in data
    assert "database" in data
    assert "redis" in data
    assert "market_provider" in data
