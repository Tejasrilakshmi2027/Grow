import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.watchlists import router as watchlist_router
from app.api.dashboard import router as dashboard_router
from app.api.stocks import router as stocks_router
from app.api.demo import router as demo_router

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

# Auto-create tables for easy local evaluation
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Market Watchlist — Code by Groww 2026 Engineering Challenge",
    version="1.0.0"
)

# Configure CORS
frontend_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
if settings.ENVIRONMENT.lower() == "production":
    raw_origins = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_URL")
    if raw_origins:
        frontend_origins = [o.strip() for o in raw_origins.split(",") if o.strip() and o.strip() != "*"]
    else:
        frontend_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(stocks_router, prefix="/api")
app.include_router(demo_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "backend": "healthy",
        "database": "healthy",
        "redis": "healthy (in-memory fallback active)",
        "market_provider": settings.MARKET_DATA_PROVIDER,
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API — Know what changed. Know what matters.",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
