from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Watchlist, WatchlistItem, User
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate, WatchlistItemCreate
from fastapi import HTTPException, status

class WatchlistService:
    def get_user_watchlists(self, db: Session, user_id: str) -> List[Watchlist]:
        return db.query(Watchlist).filter(Watchlist.user_id == user_id).all()

    def get_watchlist(self, db: Session, watchlist_id: str, user_id: str) -> Optional[Watchlist]:
        watchlist = db.query(Watchlist).filter(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id
        ).first()
        return watchlist

    def create_watchlist(self, db: Session, user_id: str, data: WatchlistCreate) -> Watchlist:
        existing = db.query(Watchlist).filter(
            Watchlist.user_id == user_id,
            Watchlist.name == data.name
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Watchlist with name '{data.name}' already exists."
            )

        watchlist = Watchlist(user_id=user_id, name=data.name)
        db.add(watchlist)
        db.commit()
        db.refresh(watchlist)
        return watchlist

    def update_watchlist(self, db: Session, watchlist_id: str, user_id: str, data: WatchlistUpdate) -> Watchlist:
        watchlist = self.get_watchlist(db, watchlist_id, user_id)
        if not watchlist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
        
        watchlist.name = data.name
        db.commit()
        db.refresh(watchlist)
        return watchlist

    def delete_watchlist(self, db: Session, watchlist_id: str, user_id: str):
        watchlist = self.get_watchlist(db, watchlist_id, user_id)
        if not watchlist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")
        db.delete(watchlist)
        db.commit()

    def add_item(self, db: Session, watchlist_id: str, user_id: str, data: WatchlistItemCreate) -> WatchlistItem:
        watchlist = self.get_watchlist(db, watchlist_id, user_id)
        if not watchlist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")

        symbol_upper = data.symbol.upper().strip()
        existing_item = db.query(WatchlistItem).filter(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol_upper
        ).first()

        if existing_item:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock '{symbol_upper}' is already in this watchlist."
            )

        item = WatchlistItem(
            watchlist_id=watchlist_id,
            symbol=symbol_upper,
            instrument_name=data.instrument_name,
            exchange=data.exchange
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def remove_item(self, db: Session, watchlist_id: str, item_id: str, user_id: str):
        watchlist = self.get_watchlist(db, watchlist_id, user_id)
        if not watchlist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist not found.")

        item = db.query(WatchlistItem).filter(
            WatchlistItem.id == item_id,
            WatchlistItem.watchlist_id == watchlist_id
        ).first()

        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")

        db.delete(item)
        db.commit()

watchlist_service = WatchlistService()
