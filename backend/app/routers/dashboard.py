from fastapi import APIRouter, Depends

from app.database import get_db
from app.dependencies import admin_user
from app.services.dashboard_service import dashboard

router = APIRouter(
    prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(admin_user)]
)


@router.get("")
def overview(db=Depends(get_db)):
    return dashboard(db)
