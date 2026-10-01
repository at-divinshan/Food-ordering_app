from typing import Literal

from pydantic import Field

from app.schemas import Input
from app.schemas.customer import CustomerIn
from app.schemas.order_item import OrderItemIn

Status = Literal["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]


class OrderIn(Input):
    customer: CustomerIn
    items: list[OrderItemIn] = Field(min_length=1, max_length=100)


class StatusIn(Input):
    status: Status
