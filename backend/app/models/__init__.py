import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    checkpoints = relationship("UserCheckpoint", back_populates="user", cascade="all, delete-orphan")

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")
    checkpoints = relationship("UserCheckpoint", back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    instrument_name = Column(String(100), nullable=False)
    exchange = Column(String(20), default="NSE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    watchlist = relationship("Watchlist", back_populates="items")

    __table_args__ = (
        UniqueConstraint('watchlist_id', 'symbol', name='uq_watchlist_symbol'),
    )

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    symbol = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
    price = Column(Float, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    previous_close = Column(Float, nullable=True)
    volume = Column(Float, default=0.0)
    avg_volume_20d = Column(Float, default=1.0)
    volatility_20d = Column(Float, default=0.015)
    market_cap = Column(Float, nullable=True)
    market_return = Column(Float, default=0.0) # Benchmark move % e.g. NIFTY
    source = Column(String(50), default="demo")
    source_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ChangeEvent(Base):
    __tablename__ = "change_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    symbol = Column(String(20), nullable=False, index=True)
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False) # e.g. PRICE_SPIKE, VOLUME_ANOMALY, OUTPERFORMANCE, CORPORATE_EVENT
    occurred_at = Column(DateTime, nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
    score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False) # NORMAL, LOW, MEDIUM, HIGH
    headline = Column(String(255), nullable=False)
    payload = Column(JSON, nullable=False) # signal values & details
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class UserCheckpoint(Base):
    __tablename__ = "user_checkpoints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    watchlist_id = Column(String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    last_checked_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="checkpoints")
    watchlist = relationship("Watchlist", back_populates="checkpoints")
    snapshots = relationship("CheckpointSnapshot", back_populates="checkpoint", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('user_id', 'watchlist_id', name='uq_user_watchlist_checkpoint'),
    )

class CheckpointSnapshot(Base):
    __tablename__ = "checkpoint_snapshots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    checkpoint_id = Column(String(36), ForeignKey("user_checkpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    price = Column(Float, nullable=False)
    volume = Column(Float, default=0.0)
    avg_volume_20d = Column(Float, default=1.0)
    volatility_20d = Column(Float, default=0.015)
    market_return = Column(Float, default=0.0)
    attention_score = Column(Float, default=0.0)
    snapshot_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    checkpoint = relationship("UserCheckpoint", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint('checkpoint_id', 'symbol', name='uq_checkpoint_symbol'),
    )
