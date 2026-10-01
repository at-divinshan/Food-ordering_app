from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select

from app.models import Customer, Food, Order, OrderItem
from app.services.customer_service import update_profile

TRANSITIONS = {
    "Pending": ["Preparing", "Cancelled"],
    "Preparing": ["Out for Delivery", "Cancelled"],
    "Out for Delivery": ["Delivered"],
    "Delivered": [],
    "Cancelled": [],
}


def serialize_order(db, order):
    customer = db.get(Customer, order.customer_id)
    rows = db.execute(
        select(OrderItem, Food)
        .join(Food, Food.id == OrderItem.food_id)
        .where(OrderItem.order_id == order.id)
    ).all()
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer": {
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
        },
        "status": order.status,
        "created_at": order.created_at,
        "total_amount": order.total_amount,
        "subtotal": sum((item.subtotal for item, food in rows), Decimal("0.00")),
        "items": [
            {
                "id": item.id,
                "food_id": food.id,
                "name": food.name,
                "image": food.image,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item, food in rows
        ],
    }


def place_order(db, user, data):
    # Serialize submissions by customer, then lock food prices/availability until commit.
    db.execute(
        select(Customer).where(Customer.user_id == user.id).with_for_update()
    ).scalar_one()
    customer = update_profile(db, user, data.customer)
    quantities = {}
    for item in data.items:
        quantities[item.food_id] = quantities.get(item.food_id, 0) + item.quantity
    if any(q > 99 for q in quantities.values()):
        raise HTTPException(422, "Maximum 99 of each food per order")
    foods = db.scalars(
        select(Food).where(Food.id.in_(quantities)).order_by(Food.id).with_for_update()
    ).all()
    if len(foods) != len(quantities):
        raise HTTPException(400, "One or more foods no longer exist")
    if any(not f.is_available for f in foods):
        raise HTTPException(409, "One or more foods are unavailable")
    total = sum((f.price * quantities[f.id] for f in foods), Decimal("0.00"))
    if total > Decimal("99999999.99"):
        raise HTTPException(422, "Order total exceeds the supported amount")
    order = Order(customer_id=customer.id, total_amount=total, status="Pending")
    db.add(order)
    db.flush()
    for food in foods:
        db.add(
            OrderItem(
                order_id=order.id,
                food_id=food.id,
                quantity=quantities[food.id],
                unit_price=food.price,
                subtotal=food.price * quantities[food.id],
            )
        )
    db.commit()
    db.refresh(order)
    return serialize_order(db, order)


def get_order(db, order_id, user):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if user.role != "admin":
        customer = db.get(Customer, order.customer_id)
        if customer.user_id != user.id:
            raise HTTPException(404, "Order not found")
    return order
