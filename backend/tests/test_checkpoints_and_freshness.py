import pytest

def test_checkpoint_and_dashboard_flow(client):
    # 1. Register User
    reg_resp = client.post("/api/auth/register", json={
        "name": "Ananya Sen",
        "email": "ananya@example.com",
        "password": "Password123"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch Dashboard (First Visit)
    dash_resp = client.get("/api/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash = dash_resp.json()
    assert dash["is_first_visit"] is True
    assert "watchlist_id" in dash
    wl_id = dash["watchlist_id"]

    # 3. Update Checkpoint
    chk_resp = client.post(f"/api/dashboard/checkpoint/{wl_id}", headers=headers)
    assert chk_resp.status_code == 200
    assert chk_resp.json()["status"] == "success"

    # 4. Fetch Dashboard again (Returning Visit)
    dash_resp2 = client.get(f"/api/dashboard?watchlist_id={wl_id}", headers=headers)
    assert dash_resp2.status_code == 200
    dash2 = dash_resp2.json()
    assert dash2["is_first_visit"] is False

def test_demo_shock_controller(client):
    # Trigger demo shock on RELIANCE
    shock_resp = client.post("/api/demo/trigger-shock", json={
        "symbol": "RELIANCE",
        "price_change_pct": 5.2,
        "volume_mult": 3.0,
        "headline": "Massive Strategic Investment Announced"
    })
    assert shock_resp.status_code == 200
    assert shock_resp.json()["status"] == "success"

    # Verify updated quote reflects shock
    quote_resp = client.get("/api/stocks/RELIANCE")
    assert quote_resp.status_code == 200
    q = quote_resp.json()
    assert q["volume_ratio"] == 3.0
