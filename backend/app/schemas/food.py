from decimal import Decimal

from pydantic import Field, field_validator

from app.schemas import Input, Output


class FoodIn(Input):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=255)
    price: Decimal = Field(gt=0, le=99999999.99, max_digits=10, decimal_places=2)
    image: str | None = Field(default=None, max_length=255)
    is_available: bool = True
    category_id: int = Field(gt=0)

    @field_validator("image")
    @classmethod
    def image_url(cls, value):
        if value and not value.startswith(("https://", "http://", "/")):
            raise ValueError("Use an HTTP(S) URL or a local image path")
        return value


class FoodOut(Output):
    id: int
    name: str
    description: str | None
    price: Decimal
    image: str | None
    is_available: bool | None
    category_id: int
