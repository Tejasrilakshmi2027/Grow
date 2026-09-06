# PulseWatch — Architecture Decision Records (ADR)

## Decision 1: Modular Monolith vs. Microservices
- **Context**: Code by Groww 2026 challenge requires high reliability, rapid setup, clear user isolation, and maintainable state handling.
- **Decision**: Built PulseWatch as a modular monolith in Python FastAPI with decoupled services (`MarketDataProvider`, `ChangeDetectionService`, `UserCheckpointService`, `ExplanationService`).
- **Rationale**: A modular monolith avoids distributed tracing complexity, latency overheads, and split-brain states while enforcing strict domain boundary interfaces.

## Decision 2: PostgreSQL / SQLite as Source of Truth
- **Context**: We need persistent storage for users, watchlists, market snapshots, detected events, and per-user/watchlist checkpoints (`last_checked_at`).
- **Decision**: Use relational database ORM (SQLAlchemy 2.0 with Async support) with explicit unique constraints and foreign keys.
- **Rationale**: SQLite allows zero-dependency local dev/testing without Docker, while PostgreSQL is supported out-of-the-box for production deployments via `DATABASE_URL`.

## Decision 3: Redis Cache & Distributed Locking with In-Memory Graceful Fallback
- **Context**: Market quotes and snapshot calculations are heavily read-bound. Market ticks shouldn't hit database on every request.
- **Decision**: Implemented Redis cache with TTLs and distributed locks for background data sync, paired with a thread-safe in-memory cache fallback when Redis is offline.
- **Rationale**: Ensures resilience during local evaluation without forcing judges to run Redis, while scaling cleanly in Docker Compose.

## Decision 4: Deterministic Explainable Scoring Model
- **Context**: Arbitrary AI outputs or black-box scores lack transparency for financial applications.
- **Decision**: Developed a transparent 0–100 score based on 7 weighted signals:
  1. Price Movement (0.25)
  2. Volume Anomaly (0.20)
  3. Volatility Shift (0.15)
  4. Market-Relative Outperformance (0.15)
  5. Corporate Events (0.15)
  6. News Signal (0.05)
  7. Recency Signal (0.05)
- **Rationale**: Ensures every attention score can be disaggregated into numerical contributions, generating verifiable explanations ("Why this matters").

## Decision 5: Optional AI Explanation Enhancement with Fallback Templates
- **Context**: AI should not be a single point of failure or introduce hallucinated financial numbers.
- **Decision**: Core change detection and attention scoring operate 100% deterministically. Optional LLM integrations can enrich microcopy, but deterministic templating is the default fallback.
- **Rationale**: Financial accuracy and speed are paramount; AI enhances narrative without controlling score calculations.

## Decision 6: Explicit Data Freshness Indicators
- **Context**: Stock quotes can become delayed or stale.
- **Decision**: Every quote response attaches metadata: `source`, `fetched_at`, `source_timestamp`, and `freshness_status` (`fresh`, `aging`, `stale`).
- **Rationale**: Prevents users from acting on stale data and ensures complete transparency about market feed health.

## Decision 7: Per-User Watchlist Checkpointing (`last_checked_at`)
- **Context**: The central product question is "What changed since I last checked?".
- **Decision**: Maintain a `UserCheckpoint` table tracking `last_checked_at` timestamps per user per watchlist. Only events occurring *after* `last_checked_at` are surfaced under "Since You Last Checked".
- **Rationale**: Eliminates alert fatigue by preventing repeated display of old events once seen.
