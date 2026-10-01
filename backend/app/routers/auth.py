from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.database import get_db
from app.dependencies import (
    DUMMY_HASH,
    create_token,
    current_user,
    hash_password,
    verify_password,
)
from app.models import Customer, User
from app.schemas.auth import Login, Register, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


def session(user):
    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "user": UserOut.model_validate(user),
    }


@router.post("/register", status_code=201)
def register(data: Register, db=Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)) or db.scalar(
        select(Customer).where(Customer.email == data.email)
    ):
        raise HTTPException(409, "An account with this email already exists")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="customer",
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(
        Customer(
            user_id=user.id, name=user.name, email=user.email, phone="", address=""
        )
    )
    db.commit()
    db.refresh(user)
    return session(user)


@router.post("/login")
def login(data: Login, db=Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    valid = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid or not user.is_active:
        raise HTTPException(401, "Invalid email or password")
    return session(user)


@router.get("/me", response_model=UserOut)
def me(user=Depends(current_user)):
    return user
