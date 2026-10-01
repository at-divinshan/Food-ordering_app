from fastapi import HTTPException
from sqlalchemy import select

from app.models import Category


def get_category(db, category_id):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    return category


def list_categories(db):
    return db.scalars(select(Category).order_by(Category.name)).all()
