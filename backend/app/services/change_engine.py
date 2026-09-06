import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings
from app.schemas.market import StockQuote
from app.schemas.change_engine import SignalContribution, ExplanationOut

class ChangeDetectionEngine:
    """
    Modular engine calculating 7 structured signals and normalized 0-100 Attention Scores.
    Weights are centralized and configurable via app.core.config.settings.
    """
    def calculate_attention_score(
        self,
        quote: StockQuote,
        corporate_events: List[Dict[str, Any]],
        news_items: List[Dict[str, Any]],
        last_checked_at: Optional[datetime] = None
    ) -> Tuple[float, str, List[SignalContribution], ExplanationOut]:
        
        signals: List[SignalContribution] = []

        # 1. Price Movement Signal
        abs_change_pct = abs(quote.change_percent)
        # 0% change -> 0 score, 5% change -> ~80 score, 10%+ change -> 100 score
        price_raw_score = min(100.0, (abs_change_pct / 5.0) * 80.0)
        price_contrib = price_raw_score * settings.WEIGHT_PRICE_MOVE
        signals.append(SignalContribution(
            name="Price Movement",
            code="PRICE_MOVE",
            raw_value=quote.change_percent,
            contribution=round(price_contrib, 2),
            weight=settings.WEIGHT_PRICE_MOVE,
            description=f"Price moved {quote.change_percent:+.2f}% since last close."
        ))

        # 2. Volume Anomaly Signal
        vol_ratio = quote.volume_ratio
        # 1.0x -> 0 score, 2.0x -> 50 score, 3.0x+ -> 100 score
        vol_raw_score = min(100.0, max(0.0, (vol_ratio - 1.0) * 50.0))
        vol_contrib = vol_raw_score * settings.WEIGHT_VOLUME_ANOMALY
        signals.append(SignalContribution(
            name="Volume Anomaly",
            code="VOLUME_ANOMALY",
            raw_value=vol_ratio,
            contribution=round(vol_contrib, 2),
            weight=settings.WEIGHT_VOLUME_ANOMALY,
            description=f"Trading volume is {vol_ratio:.1f}x the 20-day average."
        ))

        # 3. Volatility Shift Signal
        # Use actual 20-day annualized volatility (std dev of daily log returns * sqrt(252)) from quote
        # Baseline equity annualized volatility ~15%. Volatility expansion above 15% increases score.
        annualized_vol = quote.volatility_20d if quote.volatility_20d > 0.05 else quote.volatility_20d * math.sqrt(252)
        vol_pct = annualized_vol * 100.0
        # 15% annualized -> 0 score, 25% -> 40 score, 40%+ -> 100 score
        vol_raw_score = min(100.0, max(0.0, (vol_pct - 15.0) * 4.0))
        volatility_contrib = vol_raw_score * settings.WEIGHT_VOLATILITY_SHIFT
        signals.append(SignalContribution(
            name="Volatility Shift",
            code="VOLATILITY_SHIFT",
            raw_value=round(vol_pct, 2),
            contribution=round(volatility_contrib, 2),
            weight=settings.WEIGHT_VOLATILITY_SHIFT,
            description=f"20-day annualized volatility at {vol_pct:.1f}% (log return std dev)."
        ))

        # 4. Market-Relative Outperformance Signal
        if quote.relative_outperformance is not None:
            rel_perf = quote.relative_outperformance
            rel_raw_score = min(100.0, max(0.0, abs(rel_perf) * 25.0))
            rel_desc = f"Outperformed market benchmark by {rel_perf:+.2f}%."
        else:
            rel_perf = 0.0
            rel_raw_score = 0.0
            rel_desc = "Market benchmark data unavailable; signal neutral."

        rel_contrib = rel_raw_score * settings.WEIGHT_MARKET_RELATIVE
        signals.append(SignalContribution(
            name="Market Relative Outperformance",
            code="MARKET_RELATIVE",
            raw_value=rel_perf,
            contribution=round(rel_contrib, 2),
            weight=settings.WEIGHT_MARKET_RELATIVE,
            description=rel_desc
        ))

        # 5. Corporate Event Signal
        has_corp_event = len(corporate_events) > 0
        corp_raw_score = 100.0 if has_corp_event else 0.0
        corp_contrib = corp_raw_score * settings.WEIGHT_CORPORATE_EVENT
        corp_desc = corporate_events[0]["headline"] if has_corp_event else "No corporate filings or events detected."
        signals.append(SignalContribution(
            name="Corporate Events",
            code="CORPORATE_EVENT",
            raw_value=1.0 if has_corp_event else 0.0,
            contribution=round(corp_contrib, 2),
            weight=settings.WEIGHT_CORPORATE_EVENT,
            description=corp_desc
        ))

        # 6. News Signal
        has_news = len(news_items) > 0
        news_raw_score = 80.0 if has_news else 0.0
        news_contrib = news_raw_score * settings.WEIGHT_NEWS_SIGNAL
        news_desc = news_items[0]["headline"] if has_news else "News signals quiet."
        signals.append(SignalContribution(
            name="News Signals",
            code="NEWS_SIGNAL",
            raw_value=1.0 if has_news else 0.0,
            contribution=round(news_contrib, 2),
            weight=settings.WEIGHT_NEWS_SIGNAL,
            description=news_desc
        ))

        # 7. Recency Signal
        now = datetime.now(timezone.utc)
        if last_checked_at:
            hours_since_check = (now - last_checked_at.replace(tzinfo=timezone.utc) if last_checked_at.tzinfo is None else now - last_checked_at).total_seconds() / 3600.0
            recency_raw_score = max(0.0, min(100.0, 100.0 - (hours_since_check * 2.0)))
        else:
            recency_raw_score = 50.0

        recency_contrib = recency_raw_score * settings.WEIGHT_RECENCY
        signals.append(SignalContribution(
            name="Recency",
            code="RECENCY",
            raw_value=round(recency_raw_score, 1),
            contribution=round(recency_contrib, 2),
            weight=settings.WEIGHT_RECENCY,
            description="Recency decay applied relative to last visit checkpoint."
        ))

        # Total Attention Score (Clamped 0 - 100)
        raw_total_score = sum(s.contribution for s in signals)
        total_score = round(max(0.0, min(100.0, raw_total_score)), 1)

        # Severity Classification
        if total_score >= settings.ATTENTION_THRESHOLD_HIGH:
            severity = "HIGH"
        elif total_score >= settings.ATTENTION_THRESHOLD_MEDIUM:
            severity = "MEDIUM"
        elif total_score >= settings.ATTENTION_THRESHOLD_LOW:
            severity = "LOW"
        else:
            severity = "NORMAL"

        # Generate structured explanation
        explanation = self.generate_explanation(quote, total_score, severity, signals, corporate_events)

        return total_score, severity, signals, explanation

    def generate_explanation(
        self,
        quote: StockQuote,
        score: float,
        severity: str,
        signals: List[SignalContribution],
        corporate_events: List[Dict[str, Any]]
    ) -> ExplanationOut:
        
        bullets = []

        # Find top driving signals
        sorted_signals = sorted(signals, key=lambda s: s.contribution, reverse=True)
        top_signals = [s for s in sorted_signals if s.contribution > 2.0]

        if quote.change_percent != 0:
            direction = "surged" if quote.change_percent > 0 else "dropped"
            rel_text = f" (relative move vs benchmark: {quote.relative_outperformance:+.2f}%)" if quote.relative_outperformance is not None else ""
            bullets.append(f"Price {direction} by {abs(quote.change_percent):.2f}%{rel_text}.")

        if quote.volume_ratio > 1.2:
            bullets.append(f"Trading volume is {quote.volume_ratio:.1f}x higher than the 20-day baseline.")

        if corporate_events:
            bullets.append(f"Corporate event logged: {corporate_events[0]['headline']}")

        if not bullets:
            bullets.append("No major price, volume, or corporate anomalies detected since baseline.")

        # Construct summary sentence
        if severity == "HIGH":
            summary = f"{quote.symbol} demands immediate attention due to unusual volume and significant market-relative outperformance."
        elif severity == "MEDIUM":
            summary = f"{quote.symbol} shows moderate structural changes with noticeable trading activity."
        elif severity == "LOW":
            summary = f"{quote.symbol} has minor price fluctuation within standard daily tolerance bounds."
        else:
            summary = f"{quote.symbol} is trading normally with no significant anomalies."

        confidence = round(min(0.95, 0.70 + (score / 400.0)), 2)

        return ExplanationOut(
            summary=summary,
            bullets=bullets,
            confidence_score=confidence,
            signals=signals
        )

change_engine = ChangeDetectionEngine()
