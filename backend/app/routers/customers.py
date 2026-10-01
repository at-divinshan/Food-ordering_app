from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select

from app.database import get_db
from app.dependencies import admin_user, customer_user
from app.models import Customer
from app.schemas.customer import CustomerIn, CustomerOut
from app.services.customer_service import get_profile, update_profile

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/me", response_model=CustomerOut)
def me(user=Depends(customer_user), db=Depends(get_db)):
    return get_profile(db, user)


@router.put("/me", response_model=CustomerOut)
def update(data: CustomerIn, user=Depends(customer_user), db=Depends(get_db)):
    profile = update_profile(db, user, data)
    db.commit()
    return profile


@router.get("", dependencies=[Depends(admin_user)])
def listing(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_db),
):
    return {
        "items": [
            CustomerOut.model_validate(c)
            for c in db.scalars(
                select(Customer)
                .order_by(Customer.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ],
        "total": db.scalar(select(func.count()).select_from(Customer)),
        "page": page,
        "page_size": page_size,
    }


@router.get(
    "/{customer_id}", response_model=CustomerOut, dependencies=[Depends(admin_user)]
)
def detail(customer_id: int, db=Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer
