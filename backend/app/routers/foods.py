from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.database import get_db
from app.dependencies import admin_user
from app.models import Food
from app.schemas.food import FoodIn, FoodOut
from app.services.category_service import get_category
from app.services.food_service import get_food, list_foods

router = APIRouter(prefix="/foods", tags=["Foods"])


@router.get("")
def listing(
    search: str = Query("", max_length=150),
    category_id: int | None = Query(None, gt=0),
    is_available: bool | None = None,
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    sort: Literal["name", "price_asc", "price_desc", "newest", "popular"] = "popular",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db=Depends(get_db),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(422, "Minimum price must not exceed maximum price")
    return list_foods(
        db,
        search,
        category_id,
        is_available,
        min_price,
        max_price,
        sort,
        page,
        page_size,
    )


@router.get("/{food_id}", response_model=FoodOut)
def detail(food_id: int, db=Depends(get_db)):
    return get_food(db, food_id)


@router.post(
    "", response_model=FoodOut, status_code=201, dependencies=[Depends(admin_user)]
)
def create(data: FoodIn, db=Depends(get_db)):
    get_category(db, data.category_id)
    food = Food(**data.model_dump())
    db.add(food)
    db.commit()
    return food


@router.put("/{food_id}", response_model=FoodOut, dependencies=[Depends(admin_user)])
def update(food_id: int, data: FoodIn, db=Depends(get_db)):
    get_category(db, data.category_id)
    food = get_food(db, food_id)
    for k, v in data.model_dump().items():
        setattr(food, k, v)
    db.commit()
    return food


@router.delete("/{food_id}", status_code=204, dependencies=[Depends(admin_user)])
def delete(food_id: int, db=Depends(get_db)):
    db.delete(get_food(db, food_id))
    db.commit()
    return Response(status_code=204)
