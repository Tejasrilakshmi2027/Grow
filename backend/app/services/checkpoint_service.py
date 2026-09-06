from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models import UserCheckpoint, CheckpointSnapshot, ChangeEvent, MarketSnapshot, Watchlist, WatchlistItem
from app.providers.factory import get_market_data_provider
from app.services.change_engine import change_engine
from app.schemas.change_engine import DashboardOverview, StockAttentionCard, UnchangedStockCard, ChangeEventOut

class CheckpointService:
    def get_or_create_checkpoint(self, db: Session, user_id: str, watchlist_id: str) -> Tuple[UserCheckpoint, bool]:
        checkpoint = db.query(UserCheckpoint).filter(
            UserCheckpoint.user_id == user_id,
            UserCheckpoint.watchlist_id == watchlist_id
        ).first()

        is_first_visit = False
        if not checkpoint:
            is_first_visit = True
            checkpoint = UserCheckpoint(
                user_id=user_id,
                watchlist_id=watchlist_id,
                last_checked_at=datetime.now(timezone.utc)
            )
            db.add(checkpoint)
            db.commit()
            db.refresh(checkpoint)

        return checkpoint, is_first_visit

    async def update_checkpoint(self, db: Session, user_id: str, watchlist_id: str) -> UserCheckpoint:
        checkpoint, _ = self.get_or_create_checkpoint(db, user_id, watchlist_id)
        checkpoint.last_checked_at = datetime.now(timezone.utc)
        
        # Get current watchlist items
        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist_id).all()
        
        # Get current market data
        provider = get_market_data_provider()
        symbols = [item.symbol for item in items]
        quotes = await provider.get_quotes_batch(symbols)
        
        # Save snapshot for each stock
        for item in items:
            q = quotes.get(item.symbol)
            if q:
                # Calculate current attention score for snapshot
                corp_events = await provider.get_corporate_events(item.symbol)
                news = await provider.get_news(item.symbol)
                
                score, severity, signals, explanation = change_engine.calculate_attention_score(
                    quote=q,
                    corporate_events=corp_events,
                    news_items=news,
                    last_checked_at=None
                )
                
                # Create or update snapshot
                existing_snapshot = db.query(CheckpointSnapshot).filter(
                    CheckpointSnapshot.checkpoint_id == checkpoint.id,
                    CheckpointSnapshot.symbol == item.symbol
                ).first()
                
                if existing_snapshot:
                    existing_snapshot.price = q.price
                    existing_snapshot.volume = q.volume
                    existing_snapshot.avg_volume_20d = q.avg_volume_20d
                    existing_snapshot.volatility_20d = q.volatility_20d
                    existing_snapshot.market_return = q.market_return
                    existing_snapshot.attention_score = score
                    existing_snapshot.snapshot_metadata = {
                        "change_percent": q.change_percent,
                        "relative_outperformance": q.relative_outperformance,
                        "volume_ratio": q.volume_ratio
                    }
                else:
                    snapshot = CheckpointSnapshot(
                        checkpoint_id=checkpoint.id,
                        symbol=item.symbol,
                        price=q.price,
                        volume=q.volume,
                        avg_volume_20d=q.avg_volume_20d,
                        volatility_20d=q.volatility_20d,
                        market_return=q.market_return,
                        attention_score=score,
                        snapshot_metadata={
                            "change_percent": q.change_percent,
                            "relative_outperformance": q.relative_outperformance,
                            "volume_ratio": q.volume_ratio
                        }
                    )
                    db.add(snapshot)
        
        db.commit()
        db.refresh(checkpoint)
        return checkpoint

    def format_time_since(self, dt: Optional[datetime]) -> str:
        if not dt:
            return "Since baseline setup"
        now = datetime.now(timezone.utc)
        target = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        diff = now - target
        secs = diff.total_seconds()

        if secs < 60:
            return "Since just a moment ago"
        elif secs < 3600:
            mins = int(secs / 60)
            return f"Since {mins} minute{'s' if mins > 1 else ''} ago"
        elif secs < 86400:
            hrs = int(secs / 3600)
            return f"Since {hrs} hour{'s' if hrs > 1 else ''} ago"
        else:
            days = int(secs / 86400)
            return f"Since {days} day{'s' if days > 1 else ''} ago ({target.strftime('%b %d, %I:%M %p')})"

    async def get_dashboard_overview(
        self,
        db: Session,
        user_id: str,
        user_name: str,
        watchlist_id: str
    ) -> DashboardOverview:
        
        watchlist = db.query(Watchlist).filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        ).first()

        if not watchlist:
            raise ValueError("Watchlist not found.")

        checkpoint, is_first_visit = self.get_or_create_checkpoint(db, user_id, watchlist_id)
        last_checked = checkpoint.last_checked_at

        items = db.query(WatchlistItem).filter(WatchlistItem.watchlist_id == watchlist_id).all()
        provider = get_market_data_provider()

        symbols = [item.symbol for item in items]
        quotes = await provider.get_quotes_batch(symbols)

        attention_cards: List[StockAttentionCard] = []
        unchanged_cards: List[UnchangedStockCard] = []

        need_attention_count = 0
        meaningful_changes_count = 0

        for item in items:
            q = quotes.get(item.symbol)
            if not q:
                continue

            corp_events = await provider.get_corporate_events(item.symbol)
            news = await provider.get_news(item.symbol)

            score, severity, signals, explanation = change_engine.calculate_attention_score(
                quote=q,
                corporate_events=corp_events,
                news_items=news,
                last_checked_at=last_checked
            )

            # Retrieve persisted change events for timeline
            events_query = db.query(ChangeEvent).filter(
                ChangeEvent.symbol == item.symbol,
                ChangeEvent.watchlist_id == watchlist_id
            ).order_by(ChangeEvent.occurred_at.desc()).limit(5).all()

            events_out = [
                ChangeEventOut(
                    id=e.id,
                    symbol=e.symbol,
                    watchlist_id=e.watchlist_id,
                    event_type=e.event_type,
                    occurred_at=e.occurred_at,
                    score=e.score,
                    severity=e.severity,
                    headline=e.headline,
                    payload=e.payload
                ) for e in events_query
            ]

            # Categorize stocks based on score threshold
            if score >= 21.0 or corp_events:
                meaningful_changes_count += 1
                if severity in ["HIGH", "MEDIUM"]:
                    need_attention_count += 1

                key_signals = [s.description for s in signals if s.contribution > 2.0]

                since_text = self.format_time_since(last_checked) if not is_first_visit else "Initial Baseline Established"

                attention_cards.append(StockAttentionCard(
                    symbol=item.symbol,
                    instrument_name=item.instrument_name,
                    exchange=item.exchange,
                    quote=q,
                    attention_score=score,
                    severity=severity,
                    last_checked_at=last_checked,
                    since_last_checked_text=since_text,
                    key_signals=key_signals,
                    explanation=explanation,
                    recent_events=events_out
                ))
            else:
                unchanged_cards.append(UnchangedStockCard(
                    symbol=item.symbol,
                    instrument_name=item.instrument_name,
                    price=q.price,
                    change_percent=q.change_percent,
                    volume_ratio=q.volume_ratio,
                    reason="No significant movement, volume anomaly, or corporate event logged."
                ))

        # Sort attention cards by highest attention score first
        attention_cards.sort(key=lambda c: c.attention_score, reverse=True)

        freshness_info = {
            "source": "PulseWatch Market Engine",
            "is_fresh": True,
            "checked_at": datetime.now(timezone.utc)
        }

        return DashboardOverview(
            watchlist_id=watchlist.id,
            watchlist_name=watchlist.name,
            user_name=user_name,
            last_checked_at=last_checked,
            is_first_visit=is_first_visit,
            need_attention_count=need_attention_count,
            meaningful_changes_count=meaningful_changes_count,
            unchanged_count=len(unchanged_cards),
            attention_cards=attention_cards,
            unchanged_cards=unchanged_cards,
            freshness=freshness_info
        )

checkpoint_service = CheckpointService()
