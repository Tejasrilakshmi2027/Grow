import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Watchlist, WatchlistItem, ChangeEvent, UserCheckpoint
from datetime import datetime, timezone, timedelta

logger = logging.basicConfig(level=logging.INFO)

def seed_demo():
    print("🌱 Seeding PulseWatch Demo Database...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if demo user exists
        demo_email = "demo@pulsewatch.app"
        existing = db.query(User).filter(User.email == demo_email).first()
        if existing:
            print(f"✅ Demo user '{demo_email}' already exists.")
            return

        demo_user = User(
            name="Aarav Sharma",
            email=demo_email,
            password_hash=get_password_hash("groww2026")
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Core India Tech & Bluechip Watchlist
        wl1 = Watchlist(user_id=demo_user.id, name="Core Bluechips & Tech")
        db.add(wl1)
        db.commit()
        db.refresh(wl1)

        wl1_stocks = [
            ("RELIANCE", "Reliance Industries Ltd.", "NSE"),
            ("TCS", "Tata Consultancy Services", "NSE"),
            ("INFY", "Infosys Limited", "NSE"),
            ("HDFCBANK", "HDFC Bank Limited", "NSE"),
            ("ICICIBANK", "ICICI Bank Limited", "NSE"),
            ("TATAMOTORS", "Tata Motors Ltd.", "NSE")
        ]
        for sym, name, exch in wl1_stocks:
            db.add(WatchlistItem(watchlist_id=wl1.id, symbol=sym, instrument_name=name, exchange=exch))
        db.commit()

        # Checkpoint from yesterday evening
        yesterday_check = datetime.now(timezone.utc) - timedelta(hours=18)
        db.add(UserCheckpoint(user_id=demo_user.id, watchlist_id=wl1.id, last_checked_at=yesterday_check))

        # Persist initial events
        db.add(ChangeEvent(
            symbol="RELIANCE",
            watchlist_id=wl1.id,
            event_type="EARNINGS_SURGE",
            occurred_at=datetime.now(timezone.utc) - timedelta(hours=2),
            score=91.0,
            severity="HIGH",
            headline="Quarterly Earnings Beat (+14% YoY Net Profit)",
            payload={"price_move": 4.82, "volume_ratio": 2.4, "nifty_outperformance": 3.9}
        ))
        db.add(ChangeEvent(
            symbol="TATAMOTORS",
            watchlist_id=wl1.id,
            event_type="VOLUME_SPIKE",
            occurred_at=datetime.now(timezone.utc) - timedelta(hours=1, minutes=15),
            score=82.0,
            severity="HIGH",
            headline="JLR Global Volume Jump +18% (3.1x Volume Surge)",
            payload={"price_move": 4.82, "volume_ratio": 3.1, "nifty_outperformance": 3.9}
        ))

        db.commit()
        print("🎉 Demo Database successfully seeded!")
        print("Credentials:")
        print("  Email: demo@pulsewatch.app")
        print("  Password: groww2026")

    except Exception as e:
        print(f"❌ Error seeding demo database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
