from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.database import get_db
from app.dependencies import admin_user
from app.models import User
from app.schemas.auth import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(admin_user)])


@router.get("")
def listing(
    search: str = Query("", max_length=150),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    stmt = select(User)
    if search:
        stmt = stmt.where(
            User.name.contains(search, autoescape=True)
            | User.email.contains(search, autoescape=True)
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    return {
        "items": [
            UserOut.model_validate(u)
            for u in db.scalars(
                stmt.order_by(User.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{user_id}", response_model=UserOut)
def update(
    user_id: int, data: UserUpdate, admin=Depends(admin_user), db=Depends(get_db)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == "admin":
        raise HTTPException(409, "Administrator accounts cannot be disabled here")
    user.is_active = data.is_active
    db.commit()
    return user
