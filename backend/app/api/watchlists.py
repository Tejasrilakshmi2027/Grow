from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models import User, Watchlist
from app.schemas.watchlist import (
    WatchlistOut, WatchlistCreate, WatchlistUpdate,
    WatchlistItemOut, WatchlistItemCreate
)
from app.services.watchlist_service import watchlist_service

router = APIRouter(prefix="/watchlists", tags=["Watchlists"])

@router.get("", response_model=List[WatchlistOut])
def get_watchlists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlists = watchlist_service.get_user_watchlists(db, current_user.id)
    return [WatchlistOut.model_validate(w) for w in watchlists]

@router.post("", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
def create_watchlist(
    data: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.create_watchlist(db, current_user.id, data)
    return WatchlistOut.model_validate(wl)

@router.get("/{watchlist_id}", response_model=WatchlistOut)
def get_watchlist(
    watchlist_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.get_watchlist(db, watchlist_id, current_user.id)
    if not wl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
    return WatchlistOut.model_validate(wl)

@router.patch("/{watchlist_id}", response_model=WatchlistOut)
def update_watchlist(
    watchlist_id: str,
    data: WatchlistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    wl = watchlist_service.update_watchlist(db, watchlist_id, current_user.id, data)
    return WatchlistOut.model_validate(wl)

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist(
    watchlist_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlist_service.delete_watchlist(db, watchlist_id, current_user.id)
    return None

@router.post("/{watchlist_id}/items", response_model=WatchlistItemOut, status_code=status.HTTP_201_CREATED)
def add_watchlist_item(
    watchlist_id: str,
    data: WatchlistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = watchlist_service.add_item(db, watchlist_id, current_user.id, data)
    return WatchlistItemOut.model_validate(item)

@router.delete("/{watchlist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_watchlist_item(
    watchlist_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    watchlist_service.remove_item(db, watchlist_id, item_id, current_user.id)
    return None
