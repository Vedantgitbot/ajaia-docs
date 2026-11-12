from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import create_token, hash_password, verify_password
from app.deps import COOKIE_NAME, get_current_user, get_db
from app.models import User
from app.schemas import LoginIn, RegisterIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_cookie(resp: Response, user_id: str) -> None:
    resp.set_cookie(
        COOKIE_NAME, create_token(user_id), httponly=True, samesite="lax",
        secure=settings.cookie_secure, max_age=settings.jwt_ttl_minutes * 60, path="/",
    )


@router.post("/register", response_model=UserOut, status_code=201)
def register(body: RegisterIn, resp: Response, db: Session = Depends(get_db)):
    user = User(email=body.email.lower(), name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    _set_cookie(resp, user.id)
    return user


@router.post("/login", response_model=UserOut)
def login(body: LoginIn, resp: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    # same error for unknown email and wrong password: no account enumeration
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    _set_cookie(resp, user.id)
    return user


@router.post("/logout", status_code=204)
def logout(resp: Response):
    resp.delete_cookie(COOKIE_NAME, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user