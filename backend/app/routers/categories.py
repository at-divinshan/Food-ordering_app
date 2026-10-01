from fastapi import APIRouter, Depends, Response

from app.database import get_db
from app.dependencies import admin_user
from app.models import Category
from app.schemas.category import CategoryIn, CategoryOut
from app.services.category_service import get_category, list_categories

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryOut])
def all_categories(db=Depends(get_db)):
    return list_categories(db)


@router.get("/{category_id}", response_model=CategoryOut)
def detail(category_id: int, db=Depends(get_db)):
    return get_category(db, category_id)


@router.post(
    "", response_model=CategoryOut, status_code=201, dependencies=[Depends(admin_user)]
)
def create(data: CategoryIn, db=Depends(get_db)):
    category = Category(**data.model_dump())
    db.add(category)
    db.commit()
    return category


@router.put(
    "/{category_id}", response_model=CategoryOut, dependencies=[Depends(admin_user)]
)
def update(category_id: int, data: CategoryIn, db=Depends(get_db)):
    category = get_category(db, category_id)
    for k, v in data.model_dump().items():
        setattr(category, k, v)
    db.commit()
    return category


@router.delete("/{category_id}", status_code=204, dependencies=[Depends(admin_user)])
def delete(category_id: int, db=Depends(get_db)):
    db.delete(get_category(db, category_id))
    db.commit()
    return Response(status_code=204)
