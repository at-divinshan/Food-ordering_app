from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas import Input, Output


class Login(Input):
    email: EmailStr = Field(max_length=150)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        return v.lower()


class Register(Login):
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class UserOut(Output):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class UserUpdate(Input):
    is_active: bool
