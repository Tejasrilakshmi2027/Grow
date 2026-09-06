from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import CheckpointSnapshot
from app.schemas.market import StockQuote


class CheckpointComparisonService:
    """
    Compares current market state against previous checkpoint snapshots
    to calculate delta metrics for attention scoring.
    """
    
    def get_checkpoint_snapshot(
        self, 
        db: Session, 
        checkpoint_id: str, 
        symbol: str
    ) -> Optional[CheckpointSnapshot]:
        """Retrieve the most recent snapshot for a symbol at a checkpoint."""
        return db.query(CheckpointSnapshot).filter(
            CheckpointSnapshot.checkpoint_id == checkpoint_id,
            CheckpointSnapshot.symbol == symbol
        ).first()
    
    def calculate_delta(
        self,
        current_quote: StockQuote,
        checkpoint_snapshot: Optional[CheckpointSnapshot]
    ) -> Dict[str, Any]:
        """
        Calculate delta metrics between current state and checkpoint snapshot.
        
        Returns:
            Dict containing:
            - price_delta: Absolute price change
            - price_delta_pct: Percentage price change since checkpoint
            - volume_delta: Absolute volume change
            - volume_ratio: Current volume / checkpoint volume ratio
            - volatility_delta: Volatility change since checkpoint
            - benchmark_delta: Market return change since checkpoint
            - has_checkpoint: Whether a checkpoint snapshot exists
        """
        if not checkpoint_snapshot:
            # No checkpoint exists - return zero deltas
            return {
                "price_delta": 0.0,
                "price_delta_pct": 0.0,
                "volume_delta": 0.0,
                "volume_ratio": 1.0,
                "volatility_delta": 0.0,
                "benchmark_delta": 0.0,
                "has_checkpoint": False
            }
        
        checkpoint_price = checkpoint_snapshot.price
        checkpoint_volume = checkpoint_snapshot.volume
        checkpoint_volatility = checkpoint_snapshot.volatility_20d
        checkpoint_market_return = checkpoint_snapshot.market_return
        
        # Calculate price delta
        price_delta = current_quote.price - checkpoint_price
        price_delta_pct = (price_delta / checkpoint_price * 100) if checkpoint_price > 0 else 0.0
        
        # Calculate volume delta
        volume_delta = current_quote.volume - checkpoint_volume
        volume_ratio = (current_quote.volume / checkpoint_volume) if checkpoint_volume > 0 else 1.0
        
        # Calculate volatility delta
        volatility_delta = current_quote.volatility_20d - checkpoint_volatility
        
        # Calculate benchmark delta
        benchmark_delta = current_quote.market_return - checkpoint_market_return
        
        return {
            "price_delta": price_delta,
            "price_delta_pct": price_delta_pct,
            "volume_delta": volume_delta,
            "volume_ratio": volume_ratio,
            "volatility_delta": volatility_delta,
            "benchmark_delta": benchmark_delta,
            "has_checkpoint": True
        }
    
    def get_checkpoint_price_change(
        self,
        db: Session,
        checkpoint_id: str,
        symbol: str,
        current_price: float
    ) -> float:
        """
        Get the percentage price change since the checkpoint.
        Returns 0 if no checkpoint exists.
        """
        snapshot = self.get_checkpoint_snapshot(db, checkpoint_id, symbol)
        if not snapshot or snapshot.price == 0:
            return 0.0
        
        return ((current_price - snapshot.price) / snapshot.price) * 100


checkpoint_comparison_service = CheckpointComparisonService()
