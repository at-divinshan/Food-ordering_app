from pydantic import Field

from app.schemas import Input


class OrderItemIn(Input):
    food_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=99, strict=True)
