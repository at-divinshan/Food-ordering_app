from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.database import get_db
from app.dependencies import admin_user, current_user, customer_user
from app.models import Customer, Order
from app.schemas.order import OrderIn, Status, StatusIn
from app.services.order_service import (
    TRANSITIONS,
    get_order,
    place_order,
    serialize_order,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", status_code=201)
def create(data: OrderIn, user=Depends(customer_user), db=Depends(get_db)):
    return place_order(db, user, data)


def listing(db, stmt, page, page_size, status, search=""):
    if status:
        stmt = stmt.where(Order.status == status)
    if search:
        stmt = stmt.join(Customer).where(
            Customer.name.contains(search, autoescape=True)
            | (Order.id == (int(search) if search.isdigit() else -1))
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(
        stmt.order_by(Order.id.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [serialize_order(db, o) for o in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/mine")
def mine(
    status: Status | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user=Depends(customer_user),
    db=Depends(get_db),
):
    customer_id = (
        select(Customer.id).where(Customer.user_id == user.id).scalar_subquery()
    )
    return listing(
        db,
        select(Order).where(Order.customer_id == customer_id),
        page,
        page_size,
        status,
    )


@router.get("", dependencies=[Depends(admin_user)])
def all_orders(
    status: Status | None = None,
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    return listing(db, select(Order), page, page_size, status, search)


@router.get("/{order_id}")
def detail(order_id: int, user=Depends(current_user), db=Depends(get_db)):
    return serialize_order(db, get_order(db, order_id, user))


@router.patch("/{order_id}/status", dependencies=[Depends(admin_user)])
def update_status(order_id: int, data: StatusIn, db=Depends(get_db)):
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(404, "Order not found")
    if data.status != order.status and data.status not in TRANSITIONS.get(
        order.status, []
    ):
        raise HTTPException(409, f"Cannot change {order.status} to {data.status}")
    order.status = data.status
    db.commit()
    return serialize_order(db, order)
