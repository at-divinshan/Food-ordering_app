from fastapi import HTTPException
from sqlalchemy import func, select

from app.models import Food, Order, OrderItem
from app.schemas.food import FoodOut


def get_food(db, food_id):
    food = db.get(Food, food_id)
    if not food:
        raise HTTPException(404, "Food not found")
    return food


def list_foods(
    db, search, category_id, is_available, min_price, max_price, sort, page, page_size
):
    stmt = select(Food)
    if search:
        stmt = stmt.where(Food.name.contains(search, autoescape=True))
    if category_id:
        stmt = stmt.where(Food.category_id == category_id)
    if is_available is not None:
        stmt = stmt.where(Food.is_available == is_available)
    if min_price is not None:
        stmt = stmt.where(Food.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Food.price <= max_price)
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    popular = (
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .where(OrderItem.food_id == Food.id, Order.status != "Cancelled")
        .scalar_subquery()
    )
    ordering = {
        "name": Food.name.asc(),
        "price_asc": Food.price.asc(),
        "price_desc": Food.price.desc(),
        "newest": Food.id.desc(),
        "popular": popular.desc(),
    }[sort]
    foods = db.scalars(
        stmt.order_by(ordering, Food.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [FoodOut.model_validate(f) for f in foods],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
