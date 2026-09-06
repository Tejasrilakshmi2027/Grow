import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PulseWatch"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Security & Auth
    JWT_SECRET: str = "change-this-in-production-use-environment-variable"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./pulsewatch.db"

    # Cache / Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS: bool = False

    # Market Data Provider
    MARKET_DATA_PROVIDER: str = "demo" # "demo" or "yahoo"
    MARKET_DATA_API_KEY: str = ""

    # Freshness Thresholds (Seconds)
    FRESHNESS_FRESH_SECONDS: int = 60
    FRESHNESS_AGING_SECONDS: int = 300

    # Change Engine Weights (Must sum to 1.0)
    WEIGHT_PRICE_MOVE: float = 0.25
    WEIGHT_VOLUME_ANOMALY: float = 0.20
    WEIGHT_VOLATILITY_SHIFT: float = 0.15
    WEIGHT_MARKET_RELATIVE: float = 0.15
    WEIGHT_CORPORATE_EVENT: float = 0.15
    WEIGHT_NEWS_SIGNAL: float = 0.05
    WEIGHT_RECENCY: float = 0.05

    # Attention Score Thresholds
    ATTENTION_THRESHOLD_LOW: float = 21.0
    ATTENTION_THRESHOLD_MEDIUM: float = 46.0
    ATTENTION_THRESHOLD_HIGH: float = 71.0

    def validate_production(self):
        if self.ENVIRONMENT.lower() == "production":
            insecure_defaults = [
                "change-this-in-production-use-environment-variable",
                "secret",
                "jwt_secret",
                ""
            ]
            if not self.JWT_SECRET or self.JWT_SECRET in insecure_defaults:
                raise ValueError("Insecure JWT_SECRET configured. In production mode, JWT_SECRET must be explicitly set via environment variable.")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
settings.validate_production()
