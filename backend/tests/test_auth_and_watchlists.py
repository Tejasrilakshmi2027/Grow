import pytest

def test_register_and_login_flow(client):
    # 1. Register new user
    reg_resp = client.post("/api/auth/register", json={
        "name": "Priya Verma",
        "email": "priya@example.com",
        "password": "SecurePassword123"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    token = data["access_token"]

    # 2. Duplicate registration fails
    dup_resp = client.post("/api/auth/register", json={
        "name": "Priya Duplicate",
        "email": "priya@example.com",
        "password": "SecurePassword123"
    })
    assert dup_resp.status_code == 400

    # 3. Login
    login_resp = client.post("/api/auth/login", json={
        "email": "priya@example.com",
        "password": "SecurePassword123"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # 4. Get Current User (/me)
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "priya@example.com"

def test_watchlist_duplicate_stock_prevention(client):
    # Register & get auth token
    reg_resp = client.post("/api/auth/register", json={
        "name": "Rahul Kumar",
        "email": "rahul@example.com",
        "password": "Password123"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch default watchlist
    wl_resp = client.get("/api/watchlists", headers=headers)
    assert wl_resp.status_code == 200
    watchlists = wl_resp.json()
    assert len(watchlists) > 0
    wl_id = watchlists[0]["id"]

    # Add new stock
    add_resp = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "TATAMOTORS",
        "instrument_name": "Tata Motors Ltd.",
        "exchange": "NSE"
    }, headers=headers)
    assert add_resp.status_code == 201

    # Attempt adding same stock to same watchlist -> fails
    dup_add_resp = client.post(f"/api/watchlists/{wl_id}/items", json={
        "symbol": "TATAMOTORS",
        "instrument_name": "Tata Motors Ltd.",
        "exchange": "NSE"
    }, headers=headers)
    assert dup_add_resp.status_code == 409
