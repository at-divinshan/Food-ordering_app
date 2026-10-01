from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

from app.database import get_db, settings
from app.models import User

password_hasher = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)
DUMMY_HASH = password_hasher.hash("dummy-password-for-timing")


def hash_password(value):
    return password_hasher.hash(value)


def verify_password(value, hashed):
    try:
        return password_hasher.verify(value, hashed)
    except (UnknownHashError, ValueError, TypeError):
        return False


def create_token(user):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user.id),
            "iat": now,
            "exp": now + timedelta(hours=8),
            "iss": "food-ordering-system",
        },
        settings.jwt_secret,
        algorithm="HS256",
    )


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer), db=Depends(get_db)
):
    error = HTTPException(
        401, "Please sign in again", headers={"WWW-Authenticate": "Bearer"}
    )
    if not credentials:
        raise error
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
            issuer="food-ordering-system",
            options={"require": ["sub", "exp", "iat", "iss"]},
        )
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise error
    if not user or not user.is_active:
        raise error
    return user


def admin_user(user=Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return user


def customer_user(user=Depends(current_user)):
    if user.role != "customer":
        raise HTTPException(403, "Customer account required")
    return user
