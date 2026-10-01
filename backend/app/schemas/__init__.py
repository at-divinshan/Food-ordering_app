from pydantic import BaseModel, ConfigDict


class Input(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class Output(BaseModel):
    model_config = ConfigDict(from_attributes=True)
