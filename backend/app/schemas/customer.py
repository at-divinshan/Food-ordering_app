from pydantic import Field

from app.schemas import Input, Output


class CustomerIn(Input):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=30, pattern=r"^[+0-9() .-]+$")
    address: str = Field(min_length=5, max_length=255)


class CustomerOut(Output):
    id: int
    user_id: int | None
    name: str
    email: str
    phone: str
    address: str
