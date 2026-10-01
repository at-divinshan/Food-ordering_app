from fastapi import HTTPException
from sqlalchemy import select

from app.models import Customer


def get_profile(db, user):
    profile = db.scalar(select(Customer).where(Customer.user_id == user.id))
    if not profile:
        raise HTTPException(404, "Customer profile not found")
    return profile


def update_profile(db, user, data):
    profile = get_profile(db, user)
    for key, value in data.model_dump().items():
        setattr(profile, key, value)
    user.name = data.name
    return profile
