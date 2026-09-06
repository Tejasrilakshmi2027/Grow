from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Watchlist
from app.schemas.change_engine import DashboardOverview
from app.services.checkpoint_service import checkpoint_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardOverview)
async def get_dashboard(
    watchlist_id: Optional[str] = Query(None, description="Target Watchlist ID. Defaults to user's first watchlist if omitted."),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_wl = None
    if watchlist_id:
        target_wl = db.query(Watchlist).filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == current_user.id
        ).first()
    else:
        target_wl = db.query(Watchlist).filter(
            Watchlist.user_id == current_user.id
        ).order_by(Watchlist.created_at.asc()).first()

    if not target_wl:
        # If user has no watchlists at all, auto-create one
        target_wl = Watchlist(user_id=current_user.id, name="My Core Watchlist")
        db.add(target_wl)
        db.commit()
        db.refresh(target_wl)

    dashboard = await checkpoint_service.get_dashboard_overview(
        db=db,
        user_id=current_user.id,
        user_name=current_user.name,
        watchlist_id=target_wl.id
    )
    return dashboard

@router.post("/checkpoint/{watchlist_id}")
async def mark_checkpoint_checked(
    watchlist_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checkpoint = await checkpoint_service.update_checkpoint(db, current_user.id, watchlist_id)
    return {
        "status": "success",
        "watchlist_id": watchlist_id,
        "last_checked_at": checkpoint.last_checked_at
    }
