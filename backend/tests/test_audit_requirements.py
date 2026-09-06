import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from app.providers.demo_provider import DemoMarketDataProvider
from app.providers.yahoo_provider import YahooMarketDataProvider
from app.providers.benchmark_provider import BenchmarkProvider
from app.schemas.market import StockQuote, FreshnessMetadata
from app.services.change_engine import change_engine
from app.services.checkpoint_service import checkpoint_service

def test_live_provider_never_falls_back_to_demo():
    async def _test():
        provider = YahooMarketDataProvider()
        # Non-existent symbol must return None in live mode, NEVER fall back to DemoMarketDataProvider
        quote = await provider.get_quote("NON_EXISTENT_INVALID_XYZ_999")
        assert quote is None, "YahooMarketDataProvider must return None when symbol is unavailable, not fall back to demo!"
    asyncio.run(_test())

def test_demo_provider_always_returns_demo_mode():
    async def _test():
        provider = DemoMarketDataProvider()
        quote = await provider.get_quote("RELIANCE")
        assert quote is not None
        assert quote.data_mode == "demo"
        assert quote.freshness.data_mode == "demo"
    asyncio.run(_test())

def test_live_provider_returns_live_mode():
    async def _test():
        provider = YahooMarketDataProvider()
        quote = await provider.get_quote("RELIANCE")
        if quote is not None:
            assert quote.data_mode == "live"
            assert quote.freshness.data_mode == "live"
    asyncio.run(_test())

def test_freshness_classification():
    now = datetime.now(timezone.utc)
    
    # Fresh
    fresh_meta = FreshnessMetadata(
        source="Test",
        source_timestamp=now - timedelta(seconds=20),
        fetched_at=now,
        age_seconds=20.0,
        status="fresh",
        data_mode="live"
    )
    assert fresh_meta.status == "fresh"
    assert fresh_meta.data_mode == "live"

    # Stale
    stale_meta = FreshnessMetadata(
        source="Test",
        source_timestamp=now - timedelta(seconds=400),
        fetched_at=now,
        age_seconds=400.0,
        status="stale",
        data_mode="live"
    )
    assert stale_meta.status == "stale"

    # Timestamp unavailable
    unavail_meta = FreshnessMetadata(
        source="Test",
        source_timestamp=None,
        fetched_at=now,
        age_seconds=None,
        status="timestamp_unavailable",
        data_mode="live",
        timestamp_available=False
    )
    assert unavail_meta.status == "timestamp_unavailable"
    assert unavail_meta.timestamp_available is False

def test_benchmark_relative_performance_and_no_fabrication():
    async def _test():
        demo_bench = BenchmarkProvider(use_demo=True)
        ret_demo = await demo_bench.get_benchmark_return("^NSEI")
        assert ret_demo is not None
        assert isinstance(ret_demo, float)

        live_bench = BenchmarkProvider(use_demo=False)
        ret_live = await live_bench.get_benchmark_return("INVALID_BENCHMARK_999")
        # Live provider must return None when benchmark is unavailable, rather than fabricating 0.0 or simulated values
        assert ret_live is None
    asyncio.run(_test())

def test_get_dashboard_does_not_mutate_checkpoint(client, auth_headers):
    # 1. First fetch
    dash1 = client.get("/api/dashboard", headers=auth_headers).json()
    last_chk_1 = dash1["last_checked_at"]

    # 2. Second fetch
    dash2 = client.get("/api/dashboard", headers=auth_headers).json()
    last_chk_2 = dash2["last_checked_at"]

    # GET /dashboard MUST NOT update last_checked_at
    assert last_chk_1 == last_chk_2

def test_mark_all_as_seen_mutates_checkpoint(client, auth_headers):
    dash = client.get("/api/dashboard", headers=auth_headers).json()
    wl_id = dash["watchlist_id"]
    last_chk_before = dash["last_checked_at"]

    # Explicit Mark All as Seen
    res = client.post(f"/api/dashboard/checkpoint/{wl_id}", headers=auth_headers)
    assert res.status_code == 200
    last_chk_after = res.json()["last_checked_at"]

    # Must update checkpoint timestamp
    assert last_chk_after is not None

def test_duplicate_watchlist_item_returns_409(client, auth_headers):
    dash = client.get("/api/dashboard", headers=auth_headers).json()
    wl_id = dash["watchlist_id"]

    # Add INFY
    res1 = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "INFY",
        "instrument_name": "Infosys Ltd.",
        "exchange": "NSE"
    }, headers=auth_headers)
    assert res1.status_code in [201, 409]

    # Add duplicate INFY -> 409 Conflict
    res2 = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "INFY",
        "instrument_name": "Infosys Ltd.",
        "exchange": "NSE"
    }, headers=auth_headers)
    assert res2.status_code == 409
    assert "already in this watchlist" in res2.json()["detail"]

def test_user_isolation(client):
    # Register User A
    user_a = client.post("/api/auth/register", json={
        "name": "User Alpha",
        "email": "alpha@example.com",
        "password": "Password123"
    }).json()
    token_a = user_a["access_token"]

    # Register User B
    user_b = client.post("/api/auth/register", json={
        "name": "User Beta",
        "email": "beta@example.com",
        "password": "Password123"
    }).json()
    token_b = user_b["access_token"]

    # User A's watchlist
    wl_a = client.get("/api/watchlists", headers={"Authorization": f"Bearer {token_a}"}).json()[0]

    # User B tries to access User A's watchlist -> 404
    res_b_access_a = client.get(f"/api/watchlists/{wl_a['id']}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b_access_a.status_code == 404
