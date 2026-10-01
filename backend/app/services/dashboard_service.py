from sqlalchemy import func, select

from app.models import Category, Customer, Food, Order, OrderItem, User


def dashboard(db):
    def count(model):
        return db.scalar(select(func.count()).select_from(model))

    statuses = dict(
        db.execute(select(Order.status, func.count()).group_by(Order.status)).all()
    )
    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == "Delivered"
        )
    )
    popular = db.execute(
        select(
            Food.id,
            Food.name,
            Food.image,
            func.sum(OrderItem.quantity).label("quantity"),
        )
        .join(OrderItem, OrderItem.food_id == Food.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status != "Cancelled")
        .group_by(Food.id, Food.name, Food.image)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    ).all()
    daily = db.execute(
        select(func.date(Order.created_at).label("date"), func.count().label("orders"))
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at).desc())
        .limit(7)
    ).all()
    return {
        "orders": count(Order),
        "customers": count(Customer),
        "users": count(User),
        "foods": count(Food),
        "categories": count(Category),
        "revenue": revenue,
        "pending_orders": statuses.get("Pending", 0),
        "delivered_orders": statuses.get("Delivered", 0),
        "statuses": statuses,
        "popular_foods": [dict(r._mapping) for r in popular],
        "daily_orders": [dict(r._mapping) for r in reversed(daily)],
    }
