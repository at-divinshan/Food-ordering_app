from pydantic import Field

from app.schemas import Input, Output


class CategoryIn(Input):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)


class CategoryOut(Output):
    id: int
    name: str
    description: str | None
