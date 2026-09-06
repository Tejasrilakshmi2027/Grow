from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models import User, Watchlist, WatchlistItem
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create default "My Core Stocks" watchlist for new user
    default_watchlist = Watchlist(user_id=new_user.id, name="My Core Watchlist")
    db.add(default_watchlist)
    db.commit()
    db.refresh(default_watchlist)

    # Populate default watchlist with initial Indian flagship stocks
    default_symbols = [
        ("RELIANCE", "Reliance Industries Ltd.", "NSE"),
        ("TCS", "Tata Consultancy Services", "NSE"),
        ("INFY", "Infosys Limited", "NSE"),
        ("HDFCBANK", "HDFC Bank Limited", "NSE"),
        ("ICICIBANK", "ICICI Bank Limited", "NSE")
    ]
    for sym, name, exch in default_symbols:
        db.add(WatchlistItem(
            watchlist_id=default_watchlist.id,
            symbol=sym,
            instrument_name=name,
            exchange=exch
        ))
    db.commit()

    access_token = create_access_token(subject=new_user.id)
    return Token(access_token=access_token, token_type="bearer", user=UserOut.model_validate(new_user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
